"""
llm.py - the ONLY file that talks to the LLM (Claude).

Think of the LLM as a function:   text in  ->  text out.
It knows a lot of general things, but it does NOT know your private data
(your company's policies, your database, today's prices...).
"""

import os

import anthropic

MODEL = "claude-opus-5-5"


def has_api_key() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def call_claude(messages, system=None, tools=None):
    """Send a conversation to Claude and return its response.

    messages: list like [{"role": "user", "content": "Hi"}]
    system:   optional instructions ("You are a helpful car-shop assistant")
    tools:    optional list of tools Claude may ask us to run (used by the agent)
    """
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
    kwargs = {
        "model": MODEL,
        "max_tokens": 16000,
        "messages": messages,
        # If a safety filter declines, let the API retry on a fallback model.
        "betas": ["server-side-fallback-2026-07-01"],
        "fallbacks": "default",
    }
    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    response = client.beta.messages.create(**kwargs)
    if response.stop_reason == "refusal":
        raise RuntimeError("Claude declined this request.")
    return response


def text_of(response) -> str:
    """Pull the plain text answer out of a Claude response."""
    return "".join(block.text for block in response.content if block.type == "text")
