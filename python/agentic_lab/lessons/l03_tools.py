"""03 · Tool contracts

@tool gives the model a schema. The contract you still have to write is
the part the schema does not carry:

- side effect: read or write
- idempotency: safe to call twice, or not
- error class: ok, policy, not_found, failed, timeout
- retry: only failed and timeout, and only inside a budget

Policy (rejected input) and not_found are not retries. Retrying them
teaches the model that a second identical call will change the rules.
If a tool is bound, assume the model will call it.
"""

from __future__ import annotations

from typing import Literal

from agentic_lab.tools import calculator, rooms, search, weather

SLUG = "tools"
TITLE = "Tool contracts"
FILE = "l03_tools.py"

ErrorClass = Literal["ok", "policy", "not_found", "failed", "timeout"]

CONTRACTS: dict[str, dict[str, object]] = {
    "weather": {"side_effect": "read", "idempotent": True},
    "calculator": {"side_effect": "read", "idempotent": True},
    "search": {"side_effect": "read", "idempotent": True},
    "rooms": {"side_effect": "write", "idempotent": False},
}

_RETRYABLE = {"failed", "timeout"}


def error_class(result: str) -> ErrorClass:
    if result.startswith("Rejected"):
        return "policy"
    if result.startswith("Calculator error"):
        return "failed"
    if result.startswith("No ") or result.startswith("no "):
        return "not_found"
    return "ok"


def retryable(kind: ErrorClass) -> bool:
    return kind in _RETRYABLE


def run() -> dict:
    schemas = [tool.get_input_jsonschema() for tool in (weather, calculator, search)]
    forecast = weather.invoke({"city": "Tokyo", "when": "weekend"})
    tip = calculator.invoke({"expression": "86 * 0.17"})
    hours = search.invoke({"query": "Katsu House hours"})
    rejected = calculator.invoke({"expression": "__import__('os').system('id')"})
    rejected_class = error_class(rejected)
    return {
        "names": [tool.name for tool in (weather, calculator, search)],
        "schemas": schemas,
        "contracts": CONTRACTS,
        "forecast": forecast,
        "tip": tip,
        "hours": hours,
        "rejected": rejected,
        "rejected_class": rejected_class,
        "retry_policy_error": retryable(rejected_class),
        "rooms_side_effect": CONTRACTS["rooms"]["side_effect"],
    }


if __name__ == "__main__":
    out = run()
    print("tools:", out["names"])
    print("forecast:", out["forecast"])
    print("tip:", out["tip"])
    print("hours:", out["hours"])
    print("rejected:", out["rejected"], out["rejected_class"])
