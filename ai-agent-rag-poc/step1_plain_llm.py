"""
STEP 1 - Plain LLM call.

Shows the PROBLEM: the LLM is smart, but it has never seen AutoMart's private policies,
so it can only guess (or 'hallucinate') the answer.

Run:  python step1_plain_llm.py "What is the restocking fee for returns?"
"""

import sys

from llm import call_claude, has_api_key, text_of

question = sys.argv[1] if len(sys.argv) > 1 else "What is AutoMart's restocking fee for returns?"

print(f"QUESTION: {question}\n")
messages = [{"role": "user", "content": question}]

if not has_api_key():
    print("(No ANTHROPIC_API_KEY set - this is what we would send to the LLM:)")
    print(messages)
    sys.exit()

answer = text_of(call_claude(messages))
print("LLM ANSWER (no private data, so it can only guess):\n")
print(answer)
