"""16 · Ask, do not invent

"Book a room" is missing when, party size, and whether a whiteboard
is required. The next node asks one question. It does not fill 2pm,
4 people, or East from the demo fixture.

A question is a successful stop. A reserve with invented slots is not.
"""

from __future__ import annotations

SLUG = "clarify"
TITLE = "Ask, do not invent"
FILE = "l16_clarify.py"

REQUIRED = ("when", "party_size", "whiteboard")


def missing(slots: dict) -> list[str]:
    return [name for name in REQUIRED if not slots.get(name)]


def next_action(slots: dict) -> dict:
    gap = missing(slots)
    if gap:
        names = ", ".join(gap)
        return {
            "action": "ask",
            "question": f"What should I use for {names}?",
            "invented": False,
            "tool": None,
        }
    return {"action": "reserve", "question": None, "invented": False, "tool": "rooms"}


def run() -> dict:
    empty = next_action({})
    partial = next_action({"when": "tomorrow 14:00"})
    ready = next_action({"when": "tomorrow 14:00", "party_size": 4, "whiteboard": True})
    return {
        "empty_action": empty["action"],
        "empty_invented": empty["invented"],
        "empty_tool": empty["tool"],
        "one_question": empty["question"].count("?") == 1,
        "partial_still_asks": partial["action"] == "ask",
        "ready_reserves": ready["action"] == "reserve" and ready["tool"] == "rooms",
    }
