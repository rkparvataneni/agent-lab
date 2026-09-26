"""25 · What is allowed into memory

A thread is the conversation. A store is a fact you chose. The choice is
the policy: a field the user stated, or a field copied from a tool result.
A model summary is not an observation. A dumped transcript is not a fact.

If the invented summary is stored, the next turn will treat it as evidence.
That is memory poisoning. Refuse the write.
"""

from __future__ import annotations

SLUG = "memory-write"
TITLE = "Memory write policy"
FILE = "l25_memory_write.py"


def admit(fact: dict) -> bool:
    if fact.get("invented"):
        return False
    if fact.get("source") == "summary":
        return False
    if fact.get("source") == "tool" and fact.get("shape") == "transcript":
        return False
    if fact.get("source") in {"user", "tool"} and fact.get("shape") == "field":
        return True
    return False


def next_turn(store: list[str]) -> list[str]:
    """Whatever you stored is evidence on the following turn."""
    return list(store)


def run() -> dict:
    user_fact = {"source": "user", "shape": "field", "text": "prefers West", "invented": False}
    tool_fact = {
        "source": "tool",
        "shape": "field",
        "text": "Saturday showers, 70%",
        "invented": False,
    }
    transcript = {
        "source": "tool",
        "shape": "transcript",
        "text": "raw tool json",
        "invented": False,
    }
    poison = {
        "source": "summary",
        "shape": "field",
        "text": "prefers East",
        "invented": True,
    }
    store = [user_fact["text"], tool_fact["text"]]
    poisoned = store + [poison["text"]]
    return {
        "admits_user_field": admit(user_fact) is True,
        "admits_tool_field": admit(tool_fact) is True,
        "rejects_transcript": admit(transcript) is False,
        "rejects_summary": admit(poison) is False,
        "clean_next_turn": next_turn(store) == ["prefers West", "Saturday showers, 70%"],
        "poison_becomes_evidence": "prefers East" in next_turn(poisoned),
    }
