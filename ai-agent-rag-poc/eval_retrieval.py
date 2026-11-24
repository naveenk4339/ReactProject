"""
eval_retrieval.py - measure how good the RAG search is, with numbers.

"How do you evaluate a RAG system?" Start with retrieval: for a set of questions
where you KNOW which fact answers them, check whether search() finds that fact.

  hit@1     = the answering fact is the top result
  recall@3  = the answering fact is somewhere in the top 3 (what the LLM gets to see)
  no-answer = for questions our documents don't cover, search() returns nothing
              (so the LLM can say "I don't know" instead of guessing)
  synonym recall@3 = questions phrased with a DIFFERENT word than the documents
              ("refund" vs "return") still get the answering fact in the top 3
  coverage  = share of knowledge-base facts that have at least one eval question
              (a fact with no question can stop being found without anyone noticing)

Change the chunking, embedding or MIN_SCORE, re-run, and compare the numbers.
No API key needed.

Run:  python eval_retrieval.py            (totals)
      python eval_retrieval.py --verbose  (one line per question: where the answer ranked)
"""

from rag import VectorStore, load_chunks

# question -> a phrase from the chunk that answers it
EVAL_SET = [
    ("What is the restocking fee for returns?", "restocking fee of 2 percent"),
    ("How many days do I have to return a car?", "within 7 days of delivery"),
    ("Can I return a car I bought on clearance?", "clearance sale cannot be returned"),
    ("How do I start a return?", "returns@automart.example"),
    ("How long does delivery take?", "3 to 5 business days"),
    ("How much does delivery cost beyond 50 miles?", "2 dollars per extra mile"),
    ("Is home delivery free?", "Free home delivery"),
    ("Can I pick up the car from the store myself?", "pick up the car from the store"),
    # Word counts alone rank the "600 and 700" rule first for "750"; the numeric-range
    # bonus in rag.py fixes that (hit@1 was 94% without it).
    ("What interest rate do I get with a credit score of 750?", "6.5 percent"),
    ("What rate do I get with a credit score of 650?", "9 percent"),
    ("Do you offer car loans?", "car loans through partner banks"),
    ("What is the minimum down payment?", "minimum down payment of 10 percent"),
    ("Which loan terms are available?", "36, 48, 60 or 72 months"),
    ("Does the warranty cover tires?", "does not cover tires"),
    ("How long is the new car warranty?", "3 year or 36,000 mile"),
    ("What warranty do used cars get?", "90 day powertrain"),
    ("How much is the extended warranty?", "1,200 dollars"),
]

# Same facts, asked with words the documents don't use (see SYNONYMS in rag.py)
SYNONYM_SET = [
    ("Is there financing available?", "car loans through partner banks"),
    ("Can I get a refund?", "return a car within 7 days"),
    ("Do you ship cars to my house?", "Free home delivery"),
    ("What does the guarantee cover?", "does not cover tires"),
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
    synonym_hits = sum(any(expected in r["text"] for r in store.search(q, top_k=top_k)) for q, expected in SYNONYM_SET)
    chunks = load_chunks()
    uncovered = [c["text"] for c in chunks if not any(expected in c["text"] for _, expected in EVAL_SET)]
    return {
        "hit@1": hits_at_1 / len(EVAL_SET),
        f"recall@{top_k}": hits_at_k / len(EVAL_SET),
        "no_answer": no_answer / len(OUT_OF_SCOPE),
        f"synonym_recall@{top_k}": synonym_hits / len(SYNONYM_SET),
        "coverage": 1 - len(uncovered) / len(chunks),
        "misses": misses,
        "uncovered": uncovered,
    }


def question_report(store=None, top_k=3):
    """One row per labelled question: the answering fact's rank (None = not in the top_k)
    and the scores, so a tuning change shows WHICH question moved, not just the total."""
    store = store or VectorStore()
    rows = []
    for group, cases in (("eval", EVAL_SET), ("synonym", SYNONYM_SET)):
        for question, expected in cases:
            results = store.search(question, top_k=top_k)
            rank = next((i for i, r in enumerate(results, start=1) if expected in r["text"]), None)
            rows.append({
                "group": group,
                "question": question,
                "rank": rank,
                "answer_score": results[rank - 1]["score"] if rank else None,
                "top_score": results[0]["score"] if results else None,
            })
    for question in OUT_OF_SCOPE:
        results = store.search(question, top_k=top_k)
        rows.append({"group": "out-of-scope", "question": question, "rank": None, "answer_score": None,
                     "top_score": results[0]["score"] if results else None})
    return rows


def print_question_report(rows):
    print(f"  {'group':<13} {'rank':<5} {'answer':<7} {'top':<6} question")
    for row in rows:
        if row["group"] == "out-of-scope":
            rank = "-" if row["top_score"] is None else "LEAK"  # out-of-scope should retrieve nothing
        else:
            rank = row["rank"] or "MISS"
        fmt = lambda score: "-" if score is None else f"{score:.2f}"
        print(f"  {row['group']:<13} {rank!s:<5} {fmt(row['answer_score']):<7} {fmt(row['top_score']):<6} {row['question']}")
    print()


if __name__ == "__main__":
    import sys

    if "--verbose" in sys.argv:
        print_question_report(question_report())
    result = evaluate()
    print(f"Retrieval eval on {len(EVAL_SET)} questions + {len(SYNONYM_SET)} synonym questions + {len(OUT_OF_SCOPE)} out-of-scope questions\n")
    for name in ("hit@1", "recall@3", "no_answer", "synonym_recall@3", "coverage"):
        print(f"  {name:<16} {result[name]:.0%}")
    for question in result["misses"]:
        print(f"  MISSED: {question}")
    for fact in result["uncovered"]:
        print(f"  NO EVAL QUESTION FOR: {fact}")
