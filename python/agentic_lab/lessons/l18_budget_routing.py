"""18 · Budgets and routing

Classification runs on the small model. The cited answer may use the
large one. If the estimate does not fit the tokens that remain, the
call is not sent.

A repeated (tool, args) inside the run is a cache hit. You already
paid for that observation.
"""

from __future__ import annotations

SLUG = "budget-routing"
TITLE = "Budgets and routing"
FILE = "l18_budget_routing.py"


def route(*, role: str, estimate: int, tokens_left: int) -> str:
    if estimate > tokens_left:
        return "stop"
    if role == "classify":
        return "small"
    return "large"


def lookup(cache: dict[str, str], fingerprint: str) -> str | None:
    return cache.get(fingerprint)


def run() -> dict:
    cache = {"weather:tokyo": "Saturday showers, 70%"}
    return {
        "classify_model": route(role="classify", estimate=12, tokens_left=1000),
        "answer_model": route(role="answer", estimate=800, tokens_left=1000),
        "over_budget": route(role="answer", estimate=800, tokens_left=40),
        "cache_hit": lookup(cache, "weather:tokyo"),
        "cache_miss": lookup(cache, "weather:osaka"),
    }
