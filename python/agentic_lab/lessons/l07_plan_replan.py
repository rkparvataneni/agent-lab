"""07 · Plan, execute, replan

Don't ask the model to improvise a four-step booking from a blank page.
Write a cheap plan as state. Execute it. When a tool fails, revise the plan
instead of retrying the same call.

This graph is mostly deterministic. The model only fills arguments and
the replan text. That is how you keep agents cheap and debuggable.
"""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from agentic_lab.tools import calendar, rooms

SLUG = "plan-replan"
TITLE = "Plan, execute, replan"
FILE = "l07_plan_replan.py"


class Job(TypedDict):
    goal: str
    plan: list[str]
    east_held: bool
    log: list[str]
    answer: str


def write_plan(state: Job) -> dict:
    return {
        "plan": [
            "confirm calendar at 14:00",
            "list rooms for 4 with a whiteboard",
            "reserve the first match",
        ]
    }


def execute(state: Job) -> dict:
    log = list(state["log"])
    log.append(calendar.invoke({"when": "tomorrow 14:00"}))
    listing = rooms.invoke({"seats": 4, "whiteboard": True, "when": "tomorrow 14:00"})
    log.append(listing)
    if state["east_held"]:
        log.append("East is held 13:00–15:00. North seats 2 and has no board.")
        return {"log": log}
    reserved = rooms.invoke({"room": "east", "seats": 4, "when": "tomorrow 14:00"})
    log.append(reserved)
    return {"log": log, "answer": "Booked East room tomorrow at 2pm."}


def should_replan(state: Job) -> str:
    if state["answer"]:
        return END
    return "replan"


def replan(state: Job) -> dict:
    reserved = rooms.invoke({"room": "west", "seats": 4, "when": "tomorrow 14:00"})
    log = [*state["log"], "Replan: skip East, book West.", reserved]
    return {
        "log": log,
        "plan": [*state["plan"], "reserve West instead of East"],
        "answer": "Booked after a conflict: West room tomorrow at 2pm.",
    }


def build():
    graph = StateGraph(Job)
    graph.add_node("write_plan", write_plan)
    graph.add_node("execute", execute)
    graph.add_node("replan", replan)
    graph.add_edge(START, "write_plan")
    graph.add_edge("write_plan", "execute")
    graph.add_conditional_edges("execute", should_replan)
    graph.add_edge("replan", END)
    return graph.compile()


def run() -> dict:
    graph = build()
    happy = graph.invoke(
        {
            "goal": "Reserve a room for 4 at 2pm with a whiteboard",
            "plan": [],
            "east_held": False,
            "log": [],
            "answer": "",
        }
    )
    conflict = graph.invoke(
        {
            "goal": "Reserve a room for 4 at 2pm with a whiteboard",
            "plan": [],
            "east_held": True,
            "log": [],
            "answer": "",
        }
    )
    return {
        "happy": happy["answer"],
        "conflict": conflict["answer"],
        "replanned": any("Replan" in line for line in conflict["log"]),
    }


if __name__ == "__main__":
    print(run())
