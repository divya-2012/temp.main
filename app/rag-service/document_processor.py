"""
Document processing — chunking text from PDF, DOCX, and plain text files.
"""
import io
from typing import Optional

from config import CHUNK_SIZE, CHUNK_OVERLAP


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {e}")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from a file based on its extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext in ("txt", "md", "csv"):
        return file_bytes.decode("utf-8", errors="replace")
    else:
        # Try to decode as text
        try:
            return file_bytes.decode("utf-8", errors="replace")
        except Exception:
            raise ValueError(f"Unsupported file type: .{ext}")


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """Split text into overlapping chunks."""
    if not text.strip():
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        # Try to break at a sentence boundary
        if end < text_len:
            # Look for sentence endings near the chunk boundary
            for sep in [". ", ".\n", "\n\n", "\n", " "]:
                last_sep = text.rfind(sep, start + chunk_size // 2, end + 100)
                if last_sep != -1:
                    end = last_sep + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - chunk_overlap
        if start >= text_len:
            break

    return chunks


def process_document(
    file_bytes: bytes,
    filename: str,
    document_id: str,
    case_id: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> list[dict]:
    """Process a document: extract text, chunk it, and return structured chunks."""
    text = extract_text(file_bytes, filename)
    text_chunks = chunk_text(text)

    return [
        {
            "text": chunk,
            "document_id": document_id,
            "document_name": filename,
            "case_id": case_id or "",
            "chunk_index": i,
            "metadata": metadata or {},
        }
        for i, chunk in enumerate(text_chunks)
    ]
