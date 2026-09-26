"""20 · A trace you can defend

A span has a name, a token count, a latency, and a status, under one
correlation id. The failed span is what you name. The final sentence
is not.

If every step was known before the first token, the architecture is a
workflow. An agent is for a next tool you cannot name yet.
"""

from __future__ import annotations

SLUG = "trace"
TITLE = "A trace you can defend"
FILE = "l20_trace.py"


def blame(spans: list[dict]) -> str | None:
    for span in spans:
        if span["status"] != "ok":
            return span["name"]
    return None


def architecture(steps_known: bool) -> str:
    return "workflow" if steps_known else "agent"


def run() -> dict:
    trace_id = "trc_tokyo"
    spans = [
        {"trace_id": trace_id, "name": "classify", "tokens": 12, "ms": 40, "status": "ok"},
        {"trace_id": trace_id, "name": "weather", "tokens": 30, "ms": 90, "status": "ok"},
        {"trace_id": trace_id, "name": "answer", "tokens": 80, "ms": 220, "status": "ok"},
    ]
    broken = [
        {"trace_id": trace_id, "name": "search", "tokens": 40, "ms": 180, "status": "failed"},
        {"trace_id": trace_id, "name": "answer", "tokens": 10, "ms": 20, "status": "ok"},
    ]
    return {
        "span_fields": sorted(spans[0]),
        "one_trace": len({span["trace_id"] for span in spans}) == 1,
        "healthy_blame": blame(spans),
        "failed_span": blame(broken),
        "known_steps": architecture(True),
        "unknown_next_tool": architecture(False),
    }
