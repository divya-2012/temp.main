import os
from dotenv import load_dotenv

load_dotenv()

# Qdrant
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "legal_documents")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSIONS = 1536
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Chunking
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
