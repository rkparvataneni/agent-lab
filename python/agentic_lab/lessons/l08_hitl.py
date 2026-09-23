"""08 · Approve, then write

interrupt() pauses before the side effect and checkpoints the thread.
Command(resume=...) continues that same thread. The node restarts from
the top, so anything before the interrupt must be safe to repeat.

Reject resumes the graph and must not reserve.
Approve reserves once. A second reserve with the same key is a no-op:
the ledger, not the model, owns idempotency.
"""

from __future__ import annotations

from typing import Any, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from agentic_lab.tools import rooms

SLUG = "hitl"
TITLE = "Approve, then write"
FILE = "l08_hitl.py"

_LEDGER: set[str] = set()


class Approval(TypedDict):
    room: str
    decision: str
    result: str


def reserve_once(room: str) -> str:
    key = f"{room}|tomorrow 14:00"
    if key in _LEDGER:
        return f"Already reserved · {room} · tomorrow 14:00."
    _LEDGER.add(key)
    return rooms.invoke({"room": room, "seats": 4, "when": "tomorrow 14:00"})


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
    return {"decision": "approve", "result": reserve_once(state["room"])}


def build():
    graph = StateGraph(Approval)
    graph.add_node("request_booking", request_booking)
    graph.add_edge(START, "request_booking")
    graph.add_edge("request_booking", END)
    return graph.compile(checkpointer=InMemorySaver())


def run() -> dict:
    _LEDGER.clear()
    graph = build()
    config = {"configurable": {"thread_id": "booking-1"}}
    paused = graph.invoke({"room": "west", "decision": "", "result": ""}, config)
    resumed = graph.invoke(Command(resume="approve"), config)

    rejected_graph = build()
    reject_config = {"configurable": {"thread_id": "booking-reject"}}
    rejected_graph.invoke({"room": "east", "decision": "", "result": ""}, reject_config)
    rejected = rejected_graph.invoke(Command(resume="reject"), reject_config)

    return {
        "paused_result": paused.get("result", ""),
        "interrupt": bool(paused.get("__interrupt__") or not paused.get("result")),
        "resumed": resumed["result"],
        "approved": "Reserved" in resumed["result"],
        "rejected": rejected["result"],
        "rejected_booked": "Reserved" in rejected["result"],
        "repeat_reserve": reserve_once("west"),
    }


if __name__ == "__main__":
    print(run())
