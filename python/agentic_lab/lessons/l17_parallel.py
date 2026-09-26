"""17 · Partial tool failure

Calculator and search do not depend on each other, so they fan out.
A 500 from search does not erase 14.62. The retry list is the failed
names only. If the retry also fails, the answer states the gap.
"""

from __future__ import annotations

SLUG = "partial"
TITLE = "Partial tool failure"
FILE = "l17_parallel.py"


def join(results: dict[str, str]) -> dict:
    kept = {name: status for name, status in results.items() if status == "ok"}
    retry = [name for name, status in results.items() if status != "ok"]
    return {"kept": sorted(kept), "retry": retry, "recomputed": []}


def run() -> dict:
    first = join({"calculator": "ok", "search": "failed"})
    after = join({"calculator": "ok", "search": "ok"})
    still_down = join({"calculator": "ok", "search": "failed"})
    return {
        "kept_tip": first["kept"] == ["calculator"],
        "retried_only_search": first["retry"] == ["search"],
        "did_not_recompute": first["recomputed"] == [],
        "both_ok": after["retry"] == [] and after["kept"] == ["calculator", "search"],
        "hours_still_unknown": still_down["retry"] == ["search"],
    }
