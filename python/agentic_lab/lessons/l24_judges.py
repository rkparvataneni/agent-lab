"""24 · Evals that fail a fluent wrong answer

"Pack an umbrella." passes a keyword check and a fluency judge. It fails
a grounded judge when the transcript has no weather call.

Structured output is parsed from the model text. Prose that happens to
contain 14.62 is not a schema. A string where a number belongs is not a
number. The judge that only likes complete sentences will ship both.
"""

from __future__ import annotations

import json

SLUG = "judges"
TITLE = "Judges and schemas"
FILE = "l24_judges.py"

GUESS = "Pack an umbrella. Saturday in Tokyo will be wet."


def fluency_judge(answer: str) -> bool:
    text = answer.strip()
    return text.endswith(".") and "don't know" not in text.lower() and len(text) > 20


def grounded_judge(*, answer: str, tool_texts: list[str]) -> bool:
    if not tool_texts:
        return False
    if "70%" in answer and not any("70%" in text for text in tool_texts):
        return False
    return any(text for text in tool_texts)


def keyword_eval(answer: str) -> bool:
    return "umbrella" in answer.lower()


def parse_amount(text: str) -> float | None:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    amount = data.get("amount_usd")
    if isinstance(amount, bool) or not isinstance(amount, (int, float)):
        return None
    if amount <= 0:
        return None
    return float(amount)


def run() -> dict:
    tool = "Saturday showers, 70% chance of rain."
    cited = "Saturday is showers, about 70% chance. Pack an umbrella."
    return {
        "fluency_passes_guess": fluency_judge(GUESS) is True,
        "keyword_passes_guess": keyword_eval(GUESS) is True,
        "grounded_rejects_guess": grounded_judge(answer=GUESS, tool_texts=[]) is False,
        "grounded_accepts_citation": grounded_judge(answer=cited, tool_texts=[tool]) is True,
        "prose_rejected": parse_amount("The tip is $14.62.") is None,
        "string_amount_rejected": parse_amount('{"amount_usd": "14.62"}') is None,
        "json_amount": parse_amount('{"amount_usd": 14.62}') == 14.62,
    }
