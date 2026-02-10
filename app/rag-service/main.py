"""
Legal AI Platform — RAG Service
FastAPI application for document ingestion and legal research queries.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time

from config import OPENAI_API_KEY
from vector_store import vector_store
from llm_client import get_embedding, get_embeddings, generate_answer
from document_processor import process_document

app = FastAPI(
    title="Legal AI RAG Service",
    description="Retrieval-Augmented Generation service for legal research",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────────

class ResearchRequest(BaseModel):
    query: str
    jurisdiction: str = "all"
    case_id: Optional[str] = None
    top_k: int = 5


class ResearchResponse(BaseModel):
    answer: str
    sources: list[dict]
    metadata: dict


class IngestResponse(BaseModel):
    document_id: str
    chunks_created: int
    message: str


class HealthResponse(BaseModel):
    status: str
    openai_configured: bool
    qdrant_connected: bool


# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check service health and connectivity."""
    qdrant_ok = False
    try:
        vector_store.client.get_collections()
        qdrant_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if qdrant_ok else "degraded",
        openai_configured=bool(OPENAI_API_KEY),
        qdrant_connected=qdrant_ok,
    )


@app.post("/api/research", response_model=ResearchResponse)
async def research_query(request: ResearchRequest):
    """
    Perform legal research: embed the query, retrieve relevant chunks,
    and generate a structured answer using the LLM.
    """
    start_time = time.time()

    try:
        # 1. Embed the query
        query_embedding = get_embedding(request.query)

        # 2. Retrieve relevant document chunks
        results = vector_store.search(
            query_embedding=query_embedding,
            top_k=request.top_k,
            case_id=request.case_id,
        )

        # 3. Generate answer with LLM
        llm_response = generate_answer(
            query=request.query,
            context_chunks=results,
            jurisdiction=request.jurisdiction,
        )

        elapsed = round(time.time() - start_time, 2)

        return ResearchResponse(
            answer=llm_response["answer"],
            sources=llm_response["sources"],
            metadata={
                "query": request.query,
                "jurisdiction": request.jurisdiction,
                "chunks_retrieved": len(results),
                "response_time_seconds": elapsed,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    case_id: Optional[str] = Form(None),
):
    """
    Ingest a document: extract text, chunk it, generate embeddings,
    and store in the vector database.
    """
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"

        # 1. Process document into chunks
        chunks = process_document(
            file_bytes=file_bytes,
            filename=filename,
            document_id=document_id,
            case_id=case_id,
            metadata={"original_filename": filename},
        )

        if not chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")

        # 2. Generate embeddings for all chunks
        texts = [c["text"] for c in chunks]
        embeddings = get_embeddings(texts)

        # 3. Store in vector database
        stored = vector_store.upsert(chunks, embeddings)

        return IngestResponse(
            document_id=document_id,
            chunks_created=stored,
            message=f"Successfully ingested {filename} ({stored} chunks)",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Remove all chunks for a document from the vector store."""
    try:
        vector_store.delete_by_document_id(document_id)
        return {"success": True, "message": f"Document {document_id} removed from vector store"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
