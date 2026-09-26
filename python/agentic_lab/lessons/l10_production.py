"""10 · Trajectory evals

A final sentence that mentions an umbrella is not an eval. keyword_eval
still passes "Pack an umbrella." The trajectory does not: it is human,
model tool-call, tool result, then the answer. If weather never ran, the
run fails even when the prose sounds confident.

Ship checklist, in the order you will actually need it:

1. Structured output — a schema, not a regex over prose.
2. Tool contracts — policy and not_found are not retries (lesson 03).
3. Loop guards — duplicate calls stop (lesson 04).
4. Failure classes — retry, replan, escalate (lesson 07).
5. Approval before every write (lesson 08).
6. Disjoint toolboxes on every handoff (lesson 09).
7. A checkpointer that outlives the process. InMemorySaver does not.
8. Tracing on the node and the tool, not only on the final message.

This fixture suite is the one that belongs in CI.
"""

from __future__ import annotations

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from agentic_lab.lessons import l03_tools, l04_react_graph, l07_plan_replan
from agentic_lab.tools import calculator

SLUG = "production"
TITLE = "Trajectory evals"
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


def trajectory_ok(kinds: list[str], used_weather: bool) -> bool:
    """Message order and the tool that had to run. The sentence is not an input."""
    return kinds == ["human", "ai", "tool", "ai"] and used_weather


def tokyo_trajectory() -> bool:
    result = l04_react_graph.build().invoke(
        {"messages": [HumanMessage(content=l04_react_graph.GOAL)], "calls": []},
        {"recursion_limit": 6},
    )
    messages = result["messages"]
    kinds = [message.type for message in messages]
    used_weather = any(getattr(message, "name", None) == "weather" for message in messages)
    return trajectory_ok(kinds, used_weather)


def keyword_eval(answer: str) -> bool:
    """A bad fixture. Confident prose passes even when no tool ran."""
    return "umbrella" in answer.lower()


def eval_suite() -> dict[str, bool]:
    tokyo = l04_react_graph.run()
    booking = l07_plan_replan.run()
    tools = l03_tools.run()
    tip = structured_tip()
    return {
        "tokyo_uses_weather": tokyo["tool_used"],
        "tokyo_mentions_umbrella": "umbrella" in tokyo["answer"].lower(),
        "tokyo_trajectory": tokyo_trajectory(),
        "loop_guard_stops_repeat": tokyo["loop_stopped"] and tokyo["loop_tool_calls"] == 1,
        "conflict_replans": booking["replanned"],
        "conflict_drops_east": "East" not in booking["conflict"],
        "transient_retries_once": booking["transient_retried"],
        "denied_escalates": booking["denied"].startswith("No legal room"),
        "policy_is_not_retried": tools["rejected_class"] == "policy" and not tools["retry_policy_error"],
        "tip_is_14_62": tip.amount_usd == 14.62,
    }


def run() -> dict:
    checks = eval_suite()
    guess = "Pack an umbrella. It always rains."
    return {
        "checks": checks,
        "passed": all(checks.values()),
        "tip": structured_tip().model_dump(),
        "keyword_eval_passes_a_guess": keyword_eval(guess),
        "trajectory_rejects_that_guess": not trajectory_ok(["human", "ai"], False),
    }


if __name__ == "__main__":
    out = run()
    print(out)
    if not out["passed"]:
        raise SystemExit("eval suite failed")
