"""21 · A side effect that survives a crash

The provider committed the charge. The process died before the checkpoint
was written. Resume sees an empty checkpoint and will call the tool again.

Delivery is at-least-once. The idempotency key is chosen before the call
and reused on resume, so the second call returns the original receipt and
does not create a new one. A freshly minted key is a second charge.

Compensation appends a reversal. It does not delete the ledger row.
"""

from __future__ import annotations

SLUG = "durability"
TITLE = "Crash and resume"
FILE = "l21_durability.py"

KEY = "west-4-tomorrow-1400"


def charge(ledger: dict[str, str], key: str) -> str:
    existing = ledger.get(key)
    if existing:
        return existing
    receipt = f"rcpt-{len(ledger) + 1}"
    ledger[key] = receipt
    return receipt


def resume(*, ledger: dict[str, str], key: str, reuse_key: bool) -> dict:
    call_key = key if reuse_key else f"{key}#2"
    already = call_key in ledger
    receipt = charge(ledger, call_key)
    return {"receipt": receipt, "provider_called": not already}


def compensate(ledger: dict[str, str], key: str) -> str:
    if key not in ledger:
        return "nothing-to-undo"
    ledger[f"{key}:reversal"] = ledger[key]
    return "reversed"


def run() -> dict:
    ledger: dict[str, str] = {}
    first = charge(ledger, KEY)
    durable = resume(ledger=ledger, key=KEY, reuse_key=True)
    naive_ledger = {KEY: first}
    naive = resume(ledger=naive_ledger, key=KEY, reuse_key=False)
    reversal = compensate(ledger, KEY)
    return {
        "first_receipt": first,
        "resume_same_receipt": durable["receipt"] == first,
        "resume_skipped_provider": durable["provider_called"] is False,
        "naive_second_charge": naive["provider_called"] is True and naive["receipt"] != first,
        "ledger_kept_original": KEY in ledger,
        "compensated": reversal == "reversed" and f"{KEY}:reversal" in ledger,
    }
