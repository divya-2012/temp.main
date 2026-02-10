"""
Embedding and LLM client using OpenAI
"""
from openai import OpenAI
from config import OPENAI_API_KEY, EMBEDDING_MODEL, LLM_MODEL


client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts."""
    if not client:
        raise ValueError("OpenAI API key not configured")

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def get_embedding(text: str) -> list[float]:
    """Generate embedding for a single text."""
    return get_embeddings([text])[0]


def generate_answer(query: str, context_chunks: list[dict], jurisdiction: str = "all") -> dict:
    """Generate an answer using the LLM with retrieved context."""
    if not client:
        return {
            "answer": "OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.",
            "sources": [],
        }

    # Build context from retrieved chunks
    context_parts = []
    sources = []
    for i, chunk in enumerate(context_chunks):
        context_parts.append(f"[Source {i+1}: {chunk.get('document_name', 'Unknown')}]\n{chunk['text']}")
        sources.append({
            "title": chunk.get("document_name", "Unknown Document"),
            "reference": chunk.get("document_id", ""),
            "relevance": round(chunk.get("score", 0), 2),
        })

    context_text = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant documents found."

    system_prompt = f"""You are an expert legal research assistant. Your role is to provide accurate,
well-structured legal research answers based on the provided context documents.

Rules:
- Always cite sources using [Source N] notation
- Be precise about legal terminology
- Clearly distinguish between different jurisdictions
- Note when information may be outdated or when the user should verify with current statutes
- Format your response with clear headings and structure
- Current jurisdiction focus: {jurisdiction}
- If the context doesn't contain enough information, say so clearly"""

    user_prompt = f"""Based on the following legal documents, answer this research question:

Question: {query}

Context:
{context_text}

Provide a comprehensive, well-structured answer with citations."""

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": sources,
    }
