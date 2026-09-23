"""07 · Failure policy

Name the failure, then pick the edge. Do not ask the model to improvise it.

- transient (timeout): retry once, then stop
- conflict (East is held): replan onto a room that still meets the constraints
- denied (nothing legal): escalate. Do not replan into a worse room

Retrying a conflict spends a tool call to relearn the same fact.
The plan lives in state so the recovery is a test, not a transcript.
"""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from agentic_lab.tools import calendar, rooms

SLUG = "plan-replan"
TITLE = "Failure policy"
FILE = "l07_plan_replan.py"


class Job(TypedDict, total=False):
    goal: str
    plan: list[str]
    east_held: bool
    failure: str
    retries: int
    log: list[str]
    answer: str


def write_plan(state: Job) -> dict:
    return {
        "plan": [
            "confirm calendar at 14:00",
            "list rooms for 4 with a whiteboard",
            "reserve the first legal match",
        ]
    }


def execute(state: Job) -> dict:
    log = list(state.get("log") or [])
    failure = state.get("failure") or ("conflict" if state.get("east_held") else "")
    retries = int(state.get("retries") or 0)

    if failure == "transient" and retries == 0:
        log.append("calendar timed out")
        return {"log": log, "retries": retries + 1}

    if failure == "denied":
        log.append("policy: no room meets seats and whiteboard")
        return {"log": log, "answer": "No legal room. Escalate to a human."}

    log.append(calendar.invoke({"when": "tomorrow 14:00"}))
    listing = rooms.invoke({"seats": 4, "whiteboard": True, "when": "tomorrow 14:00"})
    log.append(listing)
    if failure == "conflict":
        log.append("East is held 13:00–15:00. North seats 2 and has no board.")
        return {"log": log}
    reserved = rooms.invoke({"room": "east", "seats": 4, "when": "tomorrow 14:00"})
    log.append(reserved)
    return {"log": log, "answer": "Booked East room tomorrow at 2pm."}


def next_step(state: Job) -> str:
    if state.get("answer"):
        return END
    log = state.get("log") or []
    if (
        state.get("failure") == "transient"
        and int(state.get("retries") or 0) < 2
        and log
        and "timed out" in log[-1]
    ):
        return "execute"
    return "replan"


def replan(state: Job) -> dict:
    reserved = rooms.invoke({"room": "west", "seats": 4, "when": "tomorrow 14:00"})
    log = [*state.get("log", []), "Replan: skip East, book West.", reserved]
    return {
        "log": log,
        "plan": [*state.get("plan", []), "reserve West instead of East"],
        "answer": "Booked after a conflict: West room tomorrow at 2pm.",
    }


def build():
    graph = StateGraph(Job)
    graph.add_node("write_plan", write_plan)
    graph.add_node("execute", execute)
    graph.add_node("replan", replan)
    graph.add_edge(START, "write_plan")
    graph.add_edge("write_plan", "execute")
    graph.add_conditional_edges("execute", next_step)
    graph.add_edge("replan", END)
    return graph.compile()


def _job(failure: str, east_held: bool) -> Job:
    return {
        "goal": "Reserve a room for 4 at 2pm with a whiteboard",
        "plan": [],
        "east_held": east_held,
        "failure": failure,
        "retries": 0,
        "log": [],
        "answer": "",
    }


def run() -> dict:
    graph = build()
    happy = graph.invoke(_job("", False))
    conflict = graph.invoke(_job("conflict", True))
    transient = graph.invoke(_job("transient", False))
    denied = graph.invoke(_job("denied", False))
    return {
        "happy": happy["answer"],
        "conflict": conflict["answer"],
        "replanned": any("Replan" in line for line in conflict["log"]),
        "transient": transient["answer"],
        "transient_retried": transient.get("retries") == 1 and "East" in transient["answer"],
        "denied": denied["answer"],
    }


if __name__ == "__main__":
    print(run())
