"""27 · Operability

A span you can defend has a cost, and a secret that landed in it is
redacted before the trace is stored. When the latency budget breaks, name
the slower of the tool and the model. Tool time is usually the one.

Rollback serves the previous graph. Deleting the bad version from history
is not the same as forgetting that it ran.
"""

from __future__ import annotations

import re

SLUG = "operate"
TITLE = "Cost, redaction, rollback"
FILE = "l27_operate.py"

PRICE_IN = 0.000001
PRICE_OUT = 0.000004


def cost_usd(spans: list[dict]) -> float:
    total = 0.0
    for span in spans:
        total += span["tokens_in"] * PRICE_IN + span["tokens_out"] * PRICE_OUT
    return round(total, 6)


def redact(text: str) -> str:
    return re.sub(r"sk-[A-Za-z0-9]+", "[redacted]", text)


def rollback(history: list[str], bad: str) -> str:
    kept = [version for version in history if version != bad]
    if not kept:
        raise RuntimeError("no previous graph")
    return kept[-1]


def latency_blame(tool_ms: int, model_ms: int, budget_ms: int) -> str:
    if tool_ms + model_ms <= budget_ms:
        return "ok"
    return "tool" if tool_ms >= model_ms else "model"


def run() -> dict:
    spans = [
        {"name": "weather", "tokens_in": 200, "tokens_out": 20},
        {"name": "answer", "tokens_in": 50, "tokens_out": 80},
    ]
    leaked = "Authorization: sk-liveabc user wants West"
    history = ["v1", "v2", "v3"]
    return {
        "cost": cost_usd(spans),
        "redacted": redact(leaked) == "Authorization: [redacted] user wants West",
        "secret_gone": "sk-" not in redact(leaked),
        "rolled_back": rollback(history, "v3") == "v2",
        "history_keeps_the_bad_run": history == ["v1", "v2", "v3"],
        "blame_tool": latency_blame(900, 80, 500) == "tool",
        "blame_model": latency_blame(40, 800, 500) == "model",
        "within_budget": latency_blame(100, 80, 500) == "ok",
    }
