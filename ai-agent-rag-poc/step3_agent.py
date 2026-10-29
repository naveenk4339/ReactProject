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
from datetime import date, timedelta

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
    # The LLM chooses these inputs, so check them: a clear error lets it correct itself.
    if loan_amount <= 0:
        return {"error": "loan_amount must be greater than 0"}
    if annual_rate_percent < 0:
        return {"error": "annual_rate_percent cannot be negative"}
    if months <= 0 or months != int(months):
        return {"error": "months must be a whole number greater than 0"}
    r = annual_rate_percent / 100 / 12
    payment = loan_amount * r * (1 + r) ** months / ((1 + r) ** months - 1) if r else loan_amount / months
    return {"monthly_payment_usd": round(payment, 2)}


FREE_DELIVERY_MILES = 50  # same numbers as knowledge_base/delivery.txt
COST_PER_EXTRA_MILE = 2


def calculate_delivery_cost(distance_miles):
    """Delivery fee: free within 50 miles of a store, then $2 for every extra mile."""
    if distance_miles < 0:
        return {"error": "distance_miles cannot be negative"}
    extra_miles = max(0, distance_miles - FREE_DELIVERY_MILES)
    return {"distance_miles": distance_miles, "delivery_cost_usd": round(extra_miles * COST_PER_EXTRA_MILE, 2)}


DELIVERY_BUSINESS_DAYS = (3, 5)  # "3 to 5 business days after payment" in delivery.txt


def add_business_days(start, days):
    """Count forward `days` weekdays (Mon-Fri) from `start`, skipping weekends."""
    current = start
    while days > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            days -= 1
    return current


def estimate_delivery_dates(payment_date):
    """Earliest and latest delivery date for a payment made on payment_date (YYYY-MM-DD).
    Date math across weekends is easy for code and easy for an LLM to get wrong."""
    try:
        paid = date.fromisoformat(payment_date)
    except (TypeError, ValueError):
        return {"error": "payment_date must be a date like 2026-10-23"}
    earliest, latest = (add_business_days(paid, n) for n in DELIVERY_BUSINESS_DAYS)
    return {
        "payment_date": paid.isoformat(),
        "earliest_delivery": f"{earliest.isoformat()} ({earliest:%A})",
        "latest_delivery": f"{latest.isoformat()} ({latest:%A})",
    }


TOOL_FUNCTIONS = {
    "search_policies": search_policies,
    "get_car_price": get_car_price,
    "calculate_monthly_payment": calculate_monthly_payment,
    "calculate_delivery_cost": calculate_delivery_cost,
    "estimate_delivery_dates": estimate_delivery_dates,
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
    {
        "name": "calculate_delivery_cost",
        "description": "Calculate the home delivery fee in USD for a distance in miles from the nearest AutoMart store.",
        "input_schema": {
            "type": "object",
            "properties": {"distance_miles": {"type": "number", "description": "Miles from the nearest store"}},
            "required": ["distance_miles"],
        },
    },
    {
        "name": "estimate_delivery_dates",
        "description": "Estimate the earliest and latest home delivery date (3 to 5 business days, weekends skipped) "
                       "for a payment made on a given date.",
        "input_schema": {
            "type": "object",
            "properties": {"payment_date": {"type": "string", "description": "Payment date as YYYY-MM-DD"}},
            "required": ["payment_date"],
        },
    },
]

SYSTEM_PROMPT = (
    "You are AutoMart's car-shop assistant. Use the tools to look up facts and do math. "
    "Never guess prices, rates or policies - always check with a tool. Keep the final answer short."
)


def system_prompt(today=None):
    """SYSTEM_PROMPT plus today's date. LLMs don't know the current date, so without this
    "if I pay today, when does my car arrive?" would make it guess estimate_delivery_dates' input."""
    today = today or date.today()
    return f"{SYSTEM_PROMPT} Today's date is {today.isoformat()} ({today:%A})."

# ---------------------------------------------------------------
# 3. THE AGENT LOOP
# ---------------------------------------------------------------


def run_agent(question, messages=None, max_steps=10):
    """messages = the conversation so far. Pass the same list again to keep memory (see step4_chat.py)."""
    if messages is None:
        messages = []
    messages.append({"role": "user", "content": question})

    for step in range(1, max_steps + 1):
        response = call_claude(messages, system=system_prompt(), tools=TOOLS)
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
        print("calculate_delivery_cost(80) ->", calculate_delivery_cost(80))
        print("estimate_delivery_dates('2026-10-23') ->", estimate_delivery_dates("2026-10-23"))
        print("\nWith a key, the LLM decides by itself which of these to call and in what order.")
        sys.exit()

    print("\nFINAL ANSWER:\n" + run_agent(question))
