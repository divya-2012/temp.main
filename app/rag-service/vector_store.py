"""
Vector store client for Qdrant
"""
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
)
import uuid
from typing import Optional
from config import QDRANT_URL, QDRANT_COLLECTION, EMBEDDING_DIMENSIONS


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(url=QDRANT_URL)
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        exists = any(c.name == QDRANT_COLLECTION for c in collections)
        if not exists:
            self.client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIMENSIONS,
                    distance=Distance.COSINE,
                ),
            )

    def upsert(self, chunks: list[dict], embeddings: list[list[float]]):
        """Insert or update document chunks with embeddings."""
        points = []
        for chunk, embedding in zip(chunks, embeddings):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "text": chunk["text"],
                        "document_id": chunk.get("document_id", ""),
                        "document_name": chunk.get("document_name", ""),
                        "case_id": chunk.get("case_id", ""),
                        "chunk_index": chunk.get("chunk_index", 0),
                        "metadata": chunk.get("metadata", {}),
                    },
                )
            )

        self.client.upsert(
            collection_name=QDRANT_COLLECTION,
            points=points,
        )
        return len(points)

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        case_id: Optional[str] = None,
    ) -> list[dict]:
        """Search for similar documents."""
        query_filter = None
        if case_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="case_id",
                        match=MatchValue(value=case_id),
                    )
                ]
            )

        results = self.client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=top_k,
        )

        return [
            {
                "text": hit.payload.get("text", ""),
                "document_id": hit.payload.get("document_id", ""),
                "document_name": hit.payload.get("document_name", ""),
                "score": hit.score,
                "metadata": hit.payload.get("metadata", {}),
            }
            for hit in results
        ]

    def delete_by_document_id(self, document_id: str) -> int:
        """Delete all chunks for a given document."""
        self.client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )
        return 1


vector_store = VectorStore()
