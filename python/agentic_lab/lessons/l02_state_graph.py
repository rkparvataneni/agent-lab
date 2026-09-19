"""02 · StateGraph

Everything in LangGraph is: state in → node updates a slice → next node.

State is a TypedDict (or Pydantic model). Reducers like add_messages
append instead of overwrite. START and END are regular edges.

Compile() freezes the graph into a Runnable you invoke like any chain.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

SLUG = "state-graph"
TITLE = "StateGraph"
FILE = "l02_state_graph.py"


class Ticket(TypedDict):
    text: str
    kind: str
    reply: str


def classify(state: Ticket) -> dict[str, str]:
    text = state["text"].lower()
    kind = "booking" if "room" in text else "weather"
    return {"kind": kind}


def weather_desk(state: Ticket) -> dict[str, str]:
    return {"reply": "Route: weather desk. Next lesson attaches the weather tool."}


def booking_desk(state: Ticket) -> dict[str, str]:
    return {"reply": "Route: booking desk. Calendar + rooms come later."}


def route(state: Ticket) -> Literal["weather_desk", "booking_desk"]:
    return "booking_desk" if state["kind"] == "booking" else "weather_desk"


def build():
    graph = StateGraph(Ticket)
    graph.add_node("classify", classify)
    graph.add_node("weather_desk", weather_desk)
    graph.add_node("booking_desk", booking_desk)
    graph.add_edge(START, "classify")
    graph.add_conditional_edges("classify", route)
    graph.add_edge("weather_desk", END)
    graph.add_edge("booking_desk", END)
    return graph.compile()


def run() -> dict:
    graph = build()
    weather = graph.invoke({"text": "Tokyo umbrella?", "kind": "", "reply": ""})
    booking = graph.invoke({"text": "Reserve a room with a whiteboard", "kind": "", "reply": ""})
    return {"weather": weather, "booking": booking}


if __name__ == "__main__":
    print(run())
