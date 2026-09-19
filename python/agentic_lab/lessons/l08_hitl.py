"""08 · Human-in-the-loop

interrupt() pauses the graph and serializes state through the checkpointer.
You resume with Command(resume=...) on the same thread_id.

The node restarts from the top when resumed. Put interrupt() after cheap
setup, not after a side effect you cannot repeat.

Pattern: interrupt before a tool that spends money, sends email, or books
a room. Let a human approve, edit, or reject the arguments.
"""

from __future__ import annotations

from typing import Any, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from agentic_lab.tools import rooms

SLUG = "hitl"
TITLE = "Human-in-the-loop"
FILE = "l08_hitl.py"


class Approval(TypedDict):
    room: str
    decision: str
    result: str


def request_booking(state: Approval) -> dict[str, Any]:
    decision = interrupt(
        {
            "action": "rooms.reserve",
            "room": state["room"],
            "when": "tomorrow 14:00",
        }
    )
    if decision != "approve":
        return {"decision": str(decision), "result": "Booking cancelled."}
    reserved = rooms.invoke({"room": state["room"], "seats": 4, "when": "tomorrow 14:00"})
    return {"decision": "approve", "result": reserved}


def build():
    graph = StateGraph(Approval)
    graph.add_node("request_booking", request_booking)
    graph.add_edge(START, "request_booking")
    graph.add_edge("request_booking", END)
    return graph.compile(checkpointer=InMemorySaver())


def run() -> dict:
    graph = build()
    config = {"configurable": {"thread_id": "booking-1"}}
    paused = graph.invoke({"room": "west", "decision": "", "result": ""}, config)
    resumed = graph.invoke(Command(resume="approve"), config)
    return {
        "paused_result": paused.get("result", ""),
        "interrupt": bool(paused.get("__interrupt__") or not paused.get("result")),
        "resumed": resumed["result"],
        "approved": "Reserved" in resumed["result"],
    }


if __name__ == "__main__":
    print(run())
