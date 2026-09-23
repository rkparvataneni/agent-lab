"""02 · Routers and reducers

A node returns a partial update. A reducer decides whether that update
replaces the slice or appends to it. Overwriting a log is how traces vanish.

A conditional edge is a pure function of state. If you cannot name the
next node from state alone, that edge is still a prompt.

Invariant: the router does not call a model.
"""

from __future__ import annotations

import operator
from typing import Annotated, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

SLUG = "state-graph"
TITLE = "Routers and reducers"
FILE = "l02_state_graph.py"


class Ticket(TypedDict):
    text: str
    kind: str
    reply: str
    trace: Annotated[list[str], operator.add]


def classify(state: Ticket) -> dict[str, str | list[str]]:
    text = state["text"].lower()
    if "room" in text or "whiteboard" in text:
        kind = "booking"
    elif any(token in text for token in ("weather", "umbrella", "tokyo", "forecast")):
        kind = "weather"
    else:
        kind = "unclear"
    return {"kind": kind, "trace": ["classify"]}


def weather_desk(state: Ticket) -> dict[str, str | list[str]]:
    return {
        "reply": "Route: weather desk. Bind weather only. rooms.reserve is not on this path.",
        "trace": ["weather_desk"],
    }


def booking_desk(state: Ticket) -> dict[str, str | list[str]]:
    return {
        "reply": "Route: booking desk. Calendar and rooms. The weather model never sees this toolbox.",
        "trace": ["booking_desk"],
    }


def clarify(state: Ticket) -> dict[str, str | list[str]]:
    return {
        "reply": "No desk owns this. Ask for a forecast or a booking constraint. Do not guess a specialist.",
        "trace": ["clarify"],
    }


def route(state: Ticket) -> Literal["weather_desk", "booking_desk", "clarify"]:
    if state["kind"] == "booking":
        return "booking_desk"
    if state["kind"] == "weather":
        return "weather_desk"
    return "clarify"


def build():
    graph = StateGraph(Ticket)
    graph.add_node("classify", classify)
    graph.add_node("weather_desk", weather_desk)
    graph.add_node("booking_desk", booking_desk)
    graph.add_node("clarify", clarify)
    graph.add_edge(START, "classify")
    graph.add_conditional_edges("classify", route)
    graph.add_edge("weather_desk", END)
    graph.add_edge("booking_desk", END)
    graph.add_edge("clarify", END)
    return graph.compile()


def _blank(text: str) -> Ticket:
    return {"text": text, "kind": "", "reply": "", "trace": []}


def run() -> dict:
    graph = build()
    weather = graph.invoke(_blank("Tokyo umbrella?"))
    booking = graph.invoke(_blank("Reserve a room with a whiteboard"))
    unclear = graph.invoke(_blank("hello"))
    return {"weather": weather, "booking": booking, "unclear": unclear}


if __name__ == "__main__":
    print(run())
