"""12 · Hallucination

Three different lies:

1. A parametric answer with an empty observation list ("roughly $15").
2. A narrated tool result when no tool message exists.
3. A real tool result plus a claim the tool never returned.

The check is mechanical. Numbers in the answer must be a subset of numbers
in tool messages from this run. The model does not write tool messages.
"""

from __future__ import annotations

import re

SLUG = "hallucination"
TITLE = "Hallucination"
FILE = "l12_hallucination.py"

_NUMBER = re.compile(r"\d+(?:\.\d+)?")


def numbers(text: str) -> set[str]:
    return set(_NUMBER.findall(text))


def grounded(answer: str, observations: list[str], user: str = "") -> bool:
    """Numbers in the answer must come from the user message or a tool message."""
    if not observations:
        return False
    evidence = numbers(f"{user} {' '.join(observations)}")
    return numbers(answer) <= evidence


def fabricated(assistant_quotes_tool: bool, observations: list[str]) -> bool:
    """True when the assistant narrates a tool result the runtime did not produce."""
    return assistant_quotes_tool and not observations


def run() -> dict:
    user = "What's a 17% tip on an $86 dinner, and is Katsu House still open?"
    guess = "17% of $86 is roughly $15. Katsu House is probably still open."
    observations = [
        "14.62",
        "Katsu House · open 11:30–22:00. Local time 20:10.",
    ]
    grounded_answer = (
        "A 17% tip on $86 is $14.62. Katsu House is open until 22:00 "
        "and it is 20:10 now."
    )
    extra_claim = grounded_answer + " The phone number is 555-0100."
    return {
        "guess_grounded": grounded(guess, [], user),
        "cited_grounded": grounded(grounded_answer, observations, user),
        "extra_claim_grounded": grounded(extra_claim, observations, user),
        "fabricated": fabricated(True, []),
        "real_tool_not_fabricated": fabricated(True, observations),
    }
