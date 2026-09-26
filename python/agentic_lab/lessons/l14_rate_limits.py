"""14 · Rate limits

RPM is requests per minute. TPM is tokens per minute. A short request
can pass RPM and still fail TPM.

HTTP 429 with Retry-After means the budget is empty, not that the
prompt was illegal. Sleep that long and send the same request once.
A second immediate call sits in the same window.

A policy error is not a 429. Retrying it spends budget to relearn a
fact you already have.
"""

from __future__ import annotations

SLUG = "rate-limits"
TITLE = "Rate limits"
FILE = "l14_rate_limits.py"


def admit(*, rpm_used: int, rpm: int, tpm_used: int, request_tokens: int, tpm: int) -> str:
    if rpm_used >= rpm:
        return "rpm"
    if tpm_used + request_tokens > tpm:
        return "tpm"
    return "ok"


def next_action(*, status: int, error_class: str, attempt: int, honor_retry_after: bool) -> str:
    if error_class == "policy":
        return "stop"
    if status != 429:
        return "ok"
    if attempt >= 1 or not honor_retry_after:
        return "exhausted" if attempt >= 1 else "retry_now"
    return "backoff"


def run() -> dict:
    honored_steps = ["429", "sleep", "ok"]
    hammered_steps = ["429", "429"]
    return {
        "under_budget": admit(rpm_used=1, rpm=60, tpm_used=1000, request_tokens=800, tpm=30_000),
        "rpm_full": admit(rpm_used=60, rpm=60, tpm_used=0, request_tokens=10, tpm=30_000),
        "tpm_full": admit(rpm_used=1, rpm=60, tpm_used=29_500, request_tokens=800, tpm=30_000),
        "policy_not_retried": next_action(
            status=400, error_class="policy", attempt=0, honor_retry_after=True
        ),
        "honored": next_action(status=429, error_class="rate_limit", attempt=0, honor_retry_after=True),
        "honored_then_ok": next_action(
            status=200, error_class="ok", attempt=1, honor_retry_after=True
        ),
        "ignored_header": next_action(
            status=429, error_class="rate_limit", attempt=0, honor_retry_after=False
        ),
        "second_429": next_action(
            status=429, error_class="rate_limit", attempt=1, honor_retry_after=True
        ),
        "honored_trace": honored_steps,
        "hammered_trace": hammered_steps,
    }
