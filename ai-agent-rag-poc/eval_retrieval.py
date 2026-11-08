"""
eval_retrieval.py - measure how good the RAG search is, with numbers.

"How do you evaluate a RAG system?" Start with retrieval: for a set of questions
where you KNOW which fact answers them, check whether search() finds that fact.

  hit@1     = the answering fact is the top result
  recall@3  = the answering fact is somewhere in the top 3 (what the LLM gets to see)
  no-answer = for questions our documents don't cover, search() returns nothing
              (so the LLM can say "I don't know" instead of guessing)

Change the chunking, embedding or MIN_SCORE, re-run, and compare the numbers.
No API key needed.

Run:  python eval_retrieval.py
"""

from rag import VectorStore

# question -> a phrase from the chunk that answers it
EVAL_SET = [
    ("What is the restocking fee for returns?", "restocking fee of 2 percent"),
    ("How many days do I have to return a car?", "within 7 days of delivery"),
    ("Can I return a car I bought on clearance?", "clearance sale cannot be returned"),
    ("How do I start a return?", "returns@automart.example"),
    ("How long does delivery take?", "3 to 5 business days"),
    ("How much does delivery cost beyond 50 miles?", "2 dollars per extra mile"),
    ("Is home delivery free?", "Free home delivery"),
    # Known hit@1 miss: word counts can't compare numbers, so the "600 and 700" rule ranks
    # first for "750". The right chunk is still 2nd, so the LLM sees it (recall@3 holds).
    ("What interest rate do I get with a credit score of 750?", "6.5 percent"),
    ("What is the minimum down payment?", "minimum down payment of 10 percent"),
    ("Which loan terms are available?", "36, 48, 60 or 72 months"),
    ("Does the warranty cover tires?", "does not cover tires"),
    ("How long is the new car warranty?", "3 year or 36,000 mile"),
    ("How much is the extended warranty?", "1,200 dollars"),
]

# Questions none of our documents answer: search() should return nothing
OUT_OF_SCOPE = [
    "Can I pay with bitcoin?",
    "What car do you recommend for a family?",
    "quantum banana",
]


def evaluate(store=None, top_k=3):
    store = store or VectorStore()
    hits_at_1 = hits_at_k = 0
    misses = []
    for question, expected in EVAL_SET:
        texts = [r["text"] for r in store.search(question, top_k=top_k)]
        found = [expected in t for t in texts]
        hits_at_1 += bool(found) and found[0]
        hits_at_k += any(found)
        if not any(found):
            misses.append(question)
    no_answer = sum(not store.search(q, top_k=top_k) for q in OUT_OF_SCOPE)
    return {
        "hit@1": hits_at_1 / len(EVAL_SET),
        f"recall@{top_k}": hits_at_k / len(EVAL_SET),
        "no_answer": no_answer / len(OUT_OF_SCOPE),
        "misses": misses,
    }


if __name__ == "__main__":
    result = evaluate()
    print(f"Retrieval eval on {len(EVAL_SET)} questions + {len(OUT_OF_SCOPE)} out-of-scope questions\n")
    for name in ("hit@1", "recall@3", "no_answer"):
        print(f"  {name:<10} {result[name]:.0%}")
    for question in result["misses"]:
        print(f"  MISSED: {question}")
