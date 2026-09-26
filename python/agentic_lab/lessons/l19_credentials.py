"""19 · Credentials

The user token is not a message. The runtime attaches it when the
tool runs, and only with the scope that was granted. A model request
for a wider scope is a denial.

Pasting the token into the prompt means the call does not happen.
"""

from __future__ import annotations

SLUG = "credentials"
TITLE = "Credentials"
FILE = "l19_credentials.py"

GRANTED = frozenset({"rooms.reserve"})
TOKEN = "ya29.user-token"


def prompt(goal: str, *, leak: bool) -> str:
    if leak:
        return f"{goal}\nAuthorization: {TOKEN}"
    return goal


def authorize(requested: set[str]) -> str:
    if not requested <= GRANTED:
        return "denied"
    return "ok"


def call_tool(*, leak: bool, requested: set[str]) -> dict:
    text = prompt("Reserve a room", leak=leak)
    if TOKEN in text:
        return {"called": False, "reason": "secret_in_prompt", "token_in_prompt": True}
    decision = authorize(requested)
    if decision != "ok":
        return {"called": False, "reason": decision, "token_in_prompt": False}
    return {
        "called": True,
        "reason": "ok",
        "token_in_prompt": False,
        "credential_from": "runtime",
        "scope": sorted(requested),
    }


def run() -> dict:
    leaked = call_tool(leak=True, requested={"rooms.reserve"})
    scoped = call_tool(leak=False, requested={"rooms.reserve"})
    widened = call_tool(leak=False, requested={"rooms.reserve", "rooms.admin"})
    return {
        "leak_blocked": leaked["called"] is False and leaked["token_in_prompt"] is True,
        "scoped_called": scoped["called"] is True and scoped["credential_from"] == "runtime",
        "scoped_prompt_clean": scoped["token_in_prompt"] is False,
        "widen_denied": widened["called"] is False and widened["reason"] == "denied",
    }
