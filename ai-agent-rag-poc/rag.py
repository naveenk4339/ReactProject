"""
rag.py - Retrieval-Augmented Generation, built from scratch (no libraries).

RAG = 3 steps:
  1. INDEX     : split documents into small chunks and turn each chunk into a vector (a list of numbers)
  2. RETRIEVE  : turn the question into a vector and find the chunks with the most similar vectors
  3. GENERATE  : paste those chunks into the prompt and ask the LLM to answer using ONLY them

In real projects:
  - step 1 uses an *embedding model* (OpenAI/Voyage/sentence-transformers) instead of word counts
  - the vectors live in a *vector database* (Pinecone, pgvector, Chroma, FAISS...)
  The idea is exactly the same as below - only the "embed" function gets smarter.
"""

import math
import re
from collections import Counter
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge_base"

# Very common words carry no meaning, so we ignore them.
STOP_WORDS = {
    "a", "an", "the", "is", "are", "of", "to", "in", "on", "for", "and", "or", "if",
    "can", "it", "be", "by", "with", "my", "i", "do", "what", "how", "from", "at",
    "has", "have", "been", "every", "any", "this", "that", "does", "much", "many",
}


# ---------- Step 1: INDEX ----------

def load_chunks():
    """Read every .txt file and split it into one chunk per line (sentence).
    The first line of each file is just a title, so we skip it."""
    chunks = []
    for file in sorted(KNOWLEDGE_DIR.glob("*.txt")):
        for line in file.read_text().splitlines()[1:]:
            if line.strip():
                chunks.append({"source": file.name, "text": line.strip()})
    return chunks


def embed(text):
    """Turn text into a vector. Here: word -> how many times it appears.

    "Cars can be returned within 7 days" -> {"cars": 1, "returned": 1, "within": 1, "7": 1, "days": 1}
    A real embedding model returns ~1000 numbers that also capture meaning
    (so "refund" and "return" end up close together). Ours only matches exact words.
    """
    words = re.findall(r"[a-z0-9]+", text.lower())
    words = [w.rstrip("s") if len(w) > 3 else w for w in words]  # tiny "stemming": cars -> car
    return Counter(w for w in words if w not in STOP_WORDS)


def cosine_similarity(a, b):
    """How similar are two vectors? 1.0 = same direction, 0.0 = nothing in common."""
    dot = sum(a[w] * b[w] for w in a if w in b)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class VectorStore:
    """A tiny in-memory 'vector database'."""

    def __init__(self):
        self.chunks = load_chunks()
        for chunk in self.chunks:
            chunk["vector"] = embed(chunk["text"] + " " + chunk["source"].replace("_", " "))

    # ---------- Step 2: RETRIEVE ----------

    def search(self, question, top_k=3):
        """Return the top_k chunks most similar to the question."""
        q_vec = embed(question)
        scored = [(cosine_similarity(q_vec, c["vector"]), c) for c in self.chunks]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [
            {"score": round(score, 2), "source": c["source"], "text": c["text"]}
            for score, c in scored[:top_k]
            if score > 0
        ]


# ---------- Step 3: GENERATE (prompt building) ----------

def build_rag_prompt(question, retrieved):
    """'Augment' the question with the retrieved facts.

    Each fact is numbered so the LLM can cite it like [1]. Citations let the
    customer (or a reviewer) check every claim against the source document.
    """
    context = "\n".join(f"[{i}] ({r['source']}) {r['text']}" for i, r in enumerate(retrieved, start=1))
    return (
        "Answer the customer's question using ONLY the context below.\n"
        "After each fact you use, cite its number in square brackets, like [1].\n"
        "If the answer is not in the context, say \"I don't know\".\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}"
    )
