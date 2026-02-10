# RAG Service for Legal AI Platform

A FastAPI-based Retrieval-Augmented Generation (RAG) service that provides
legal research capabilities using vector search (Qdrant) and LLM integration.

## Setup

```bash
cd rag-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

- `OPENAI_API_KEY` — OpenAI API key
- `GEMINI_API_KEY` — Google Gemini API key (alternative)
- `QDRANT_URL` — Qdrant vector database URL (default: http://localhost:6333)
- `QDRANT_COLLECTION` — Qdrant collection name (default: legal_documents)
- `EMBEDDING_MODEL` — OpenAI embedding model (default: text-embedding-3-small)
- `LLM_MODEL` — LLM model name (default: gpt-4o-mini)

## API Endpoints

- `POST /api/research` — Query legal research
- `POST /api/ingest` — Ingest a document into the vector store
- `GET /api/health` — Health check
- `DELETE /api/documents/{document_id}` — Remove a document from vector store
