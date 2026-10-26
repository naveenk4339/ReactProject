"""
STEP 4 - Chat with memory.

LLMs are STATELESS: every API call starts from zero and remembers nothing.
"Memory" is just us sending the whole conversation again on every call.

    turn 1:  [user: "Price of a Civic?"]                                   -> LLM
    turn 2:  [user: "Price of a Civic?", assistant: "$26,000",
              user: "And the monthly payment over 48 months?"]             -> LLM
                                                    ^ "it" = the Civic, because the LLM sees turn 1 again

So the follow-up "what about 72 months?" works without repeating the car or the credit score.
Trade-off: the history grows every turn (more tokens = more cost), so real apps trim or
summarize old turns once the conversation gets long.

Run:  python step4_chat.py      (type 'quit' to exit)
"""

from llm import has_api_key
from step3_agent import run_agent

if __name__ == "__main__":
    if not has_api_key():
        print("(No ANTHROPIC_API_KEY set - chat needs the LLM. Try:  python -m unittest test_poc.py -v")
        print(" test_chat_memory_keeps_history shows how memory works without a key.)")
        raise SystemExit

    history = []  # <- this list IS the agent's memory
    print("AutoMart assistant. Ask anything, then a follow-up like 'what about 72 months?'. Type 'quit' to exit.\n")
    while True:
        question = input("You: ").strip()
        if question.lower() in {"quit", "exit", ""}:
            break
        answer = run_agent(question, messages=history)
        print(f"\nAssistant: {answer}")
        print(f"(memory: {len(history)} messages will be sent with your next question)\n")
