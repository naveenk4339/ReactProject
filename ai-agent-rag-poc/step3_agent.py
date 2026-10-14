"""
STEP 3 - AI Agent.

An agent = LLM + TOOLS + a LOOP.
  - We describe some tools (functions) to the LLM.
  - The LLM decides WHICH tool to call and with WHAT inputs.
  - OUR code runs the tool and sends the result back.
  - Repeat until the LLM says it has the final answer.

RAG becomes just one of the agent's tools ("search_policies").

    user question
        |
        v
    +--------+   "call get_car_price(model='Model 3')"   +-------------+
    |  LLM   | ----------------------------------------> |  our code   |
    | (brain)| <---------------------------------------- | runs tool   |
    +--------+            result: 42000                  +-------------+
        |   (loops until no more tool calls)
        v
    final answer

Run:  python step3_agent.py "I want a Model 3 on a 60 month loan, credit score 750. Monthly payment? Can I return it?"
"""

import json
import sys

from llm import call_claude, has_api_key, text_of
from rag import VectorStore

store = VectorStore()

# ---------------------------------------------------------------
# 1. TOOLS - plain Python functions the agent is allowed to use
# ---------------------------------------------------------------

CAR_PRICES = {"model 3": 42000, "civic": 26000, "camry": 29000, "mustang": 38000}  # pretend database


def search_policies(query):
    """RAG as a tool: look up AutoMart's policy documents."""
    return store.search(query, top_k=3)


def get_car_price(model):
    """Look up a car price in our 'database'."""
    price = CAR_PRICES.get(model.lower())
    return {"model": model, "price_usd": price} if price else {"error": f"Unknown model '{model}'"}


def calculate_monthly_payment(loan_amount, annual_rate_percent, months):
    """Standard loan (EMI) formula. LLMs are bad at exact math - so we give them a calculator."""
    r = annual_rate_percent / 100 / 12
    payment = loan_amount * r * (1 + r) ** months / ((1 + r) ** months - 1) if r else loan_amount / months
    return {"monthly_payment_usd": round(payment, 2)}


TOOL_FUNCTIONS = {
    "search_policies": search_policies,
    "get_car_price": get_car_price,
    "calculate_monthly_payment": calculate_monthly_payment,
}

# ---------------------------------------------------------------
# 2. TOOL DESCRIPTIONS - what the LLM reads to decide what to call
# ---------------------------------------------------------------

TOOLS = [
    {
        "name": "search_policies",
        "description": "Search AutoMart's policy documents (returns, warranty, financing/interest rates, delivery).",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "What to look for"}},
            "required": ["query"],
        },
    },
    {
        "name": "get_car_price",
        "description": "Get the price in USD of a car model sold by AutoMart.",
        "input_schema": {
            "type": "object",
            "properties": {"model": {"type": "string", "description": "e.g. 'Model 3', 'Civic'"}},
            "required": ["model"],
        },
    },
    {
        "name": "calculate_monthly_payment",
        "description": "Calculate the monthly loan payment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "loan_amount": {"type": "number"},
                "annual_rate_percent": {"type": "number"},
                "months": {"type": "integer"},
            },
            "required": ["loan_amount", "annual_rate_percent", "months"],
        },
    },
]

SYSTEM_PROMPT = (
    "You are AutoMart's car-shop assistant. Use the tools to look up facts and do math. "
    "Never guess prices, rates or policies - always check with a tool. Keep the final answer short."
)

# ---------------------------------------------------------------
# 3. THE AGENT LOOP
# ---------------------------------------------------------------


def run_agent(question, max_steps=10):
    messages = [{"role": "user", "content": question}]

    for step in range(1, max_steps + 1):
        response = call_claude(messages, system=SYSTEM_PROMPT, tools=TOOLS)
        messages.append({"role": "assistant", "content": response.content})

        # No tool requested -> the LLM has its final answer
        if response.stop_reason != "tool_use":
            return text_of(response)

        # Run every tool the LLM asked for, then send all results back together
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            print(f"[step {step}] LLM calls {block.name}({json.dumps(block.input)})")
            try:
                result = TOOL_FUNCTIONS[block.name](**block.input)
                is_error = False
            except Exception as e:  # tell the LLM about the failure so it can recover
                result, is_error = f"Tool failed: {e}", True
            print(f"         result -> {json.dumps(result)}")
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result),
                "is_error": is_error,
            })
        messages.append({"role": "user", "content": tool_results})

    return "Stopped: too many steps."


if __name__ == "__main__":
    question = sys.argv[1] if len(sys.argv) > 1 else (
        "I want to buy a Model 3 with a 60 month loan and my credit score is 750. "
        "What will my monthly payment be after the minimum down payment, and can I return it if I don't like it?"
    )
    print(f"QUESTION: {question}\n")

    if not has_api_key():
        print("(No ANTHROPIC_API_KEY set - the LLM 'brain' is unavailable, but here are the tools working on their own:)\n")
        print("search_policies('interest rate credit score') ->", search_policies("interest rate credit score"))
        print("get_car_price('Model 3') ->", get_car_price("Model 3"))
        print("calculate_monthly_payment(37800, 6.5, 60) ->", calculate_monthly_payment(37800, 6.5, 60))
        print("\nWith a key, the LLM decides by itself which of these to call and in what order.")
        sys.exit()

    print("\nFINAL ANSWER:\n" + run_agent(question))
