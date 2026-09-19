"""10 · Production patterns

Before you ship an agent, lock these down:

1. Structured output — a Pydantic model, not a blob of prose you regex.
2. Timeouts and retries on tools, not on the whole graph blindly.
3. Streaming — users watch tokens/tool events, not a 40s spinner.
4. Tracing — LangSmith (or your own) on every node and tool.
5. Evals — a fixture suite like this file. If weather is down, the graph
   must block, not invent rain. Run it in CI.
6. Checkpointer in a real database. InMemorySaver dies with the process.
7. Least-privilege tools. The weather specialist never sees rooms.reserve.
8. HITL in front of irreversible actions (lesson 08).
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from agentic_lab.lessons import l04_react_graph, l07_plan_replan
from agentic_lab.tools import calculator

SLUG = "production"
TITLE = "Production patterns"
FILE = "l10_production.py"


class TipCheck(BaseModel):
    amount_usd: float = Field(gt=0)
    restaurant_open: bool
    summary: str


def structured_tip() -> TipCheck:
    amount = float(calculator.invoke({"expression": "86 * 0.17"}))
    return TipCheck(
        amount_usd=amount,
        restaurant_open=True,
        summary=f"Tip is ${amount:.2f}. Katsu House is still open.",
    )


def eval_suite() -> dict[str, bool]:
    tokyo = l04_react_graph.run()
    booking = l07_plan_replan.run()
    tip = structured_tip()
    return {
        "tokyo_uses_weather": tokyo["tool_used"],
        "tokyo_mentions_umbrella": "umbrella" in tokyo["answer"].lower(),
        "conflict_replans": booking["replanned"],
        "tip_is_14_62": tip.amount_usd == 14.62,
    }


def run() -> dict:
    checks = eval_suite()
    return {
        "checks": checks,
        "passed": all(checks.values()),
        "tip": structured_tip().model_dump(),
    }


if __name__ == "__main__":
    out = run()
    print(out)
    if not out["passed"]:
        raise SystemExit("eval suite failed")
