"""
STEP 2 - RAG (Retrieval-Augmented Generation).

Fixes step 1: before asking the LLM, we SEARCH our own documents
and give the LLM the relevant facts inside the prompt.

    question -> [retrieve relevant chunks] -> [prompt = chunks + question] -> LLM -> grounded answer

Run:  python step2_rag.py "What is the restocking fee for returns?"
"""

import sys

from llm import call_claude, has_api_key, text_of
from rag import VectorStore, build_rag_prompt

question = sys.argv[1] if len(sys.argv) > 1 else "What is AutoMart's restocking fee for returns?"
store = VectorStore()

print(f"QUESTION: {question}\n")

# 1 + 2. Index (done inside VectorStore) and Retrieve
retrieved = store.search(question, top_k=3)
print("RETRIEVED CHUNKS (most similar first):")
for r in retrieved:
    print(f"  score={r['score']}  [{r['source']}]  {r['text']}")

# 3a. Augment the prompt
prompt = build_rag_prompt(question, retrieved)
print("\nPROMPT SENT TO THE LLM:\n" + "-" * 60 + f"\n{prompt}\n" + "-" * 60)

if not has_api_key():
    print("\n(No ANTHROPIC_API_KEY set - stopping before the LLM call.)")
    sys.exit()

# 3b. Generate
answer = text_of(call_claude([{"role": "user", "content": prompt}]))
print("\nLLM ANSWER (grounded in our documents):\n")
print(answer)
