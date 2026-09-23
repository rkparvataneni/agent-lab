"""09 · Handoff contracts

A specialist is a compiled graph. A supervisor is a router that hands
off a goal plus an allow-list. The specialist does not choose its toolbox.

Split when tools or permissions differ, not when you want a second voice.
The weather path must not be able to reserve a room. That is a property
of the handoff, not of the prompt.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, StateGraph

from agentic_lab.lessons.l04_react_graph import build as weather_graph
from agentic_lab.lessons.l07_plan_replan import build as booking_graph

SLUG = "multi-agent"
TITLE = "Handoff contracts"
FILE = "l09_multi_agent.py"


class Ticket(TypedDict):
    goal: str
    specialist: str
    allowed: list[str]
    answer: str


def supervisor(state: Ticket) -> dict[str, str | list[str]]:
    goal = state["goal"].lower()
    if "room" in goal or "whiteboard" in goal:
        return {"specialist": "booking", "allowed": ["calendar", "rooms"]}
    return {"specialist": "weather", "allowed": ["weather"]}


def route(state: Ticket) -> Literal["weather_specialist", "booking_specialist"]:
    return "booking_specialist" if state["specialist"] == "booking" else "weather_specialist"


def weather_specialist(state: Ticket) -> dict[str, str]:
    if set(state["allowed"]) != {"weather"}:
        raise RuntimeError("weather handoff included a tool outside its contract")
    result = weather_graph().invoke(
        {"messages": [HumanMessage(content=state["goal"])], "calls": []}
    )
    return {"answer": result["messages"][-1].content}


def booking_specialist(state: Ticket) -> dict[str, str]:
    if set(state["allowed"]) != {"calendar", "rooms"}:
        raise RuntimeError("booking handoff included a tool outside its contract")
    result = booking_graph().invoke(
        {
            "goal": state["goal"],
            "plan": [],
            "east_held": True,
            "failure": "conflict",
            "retries": 0,
            "log": [],
            "answer": "",
        }
    )
    return {"answer": result["answer"]}


def build():
    graph = StateGraph(Ticket)
    graph.add_node("supervisor", supervisor)
    graph.add_node("weather_specialist", weather_specialist)
    graph.add_node("booking_specialist", booking_specialist)
    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges("supervisor", route)
    graph.add_edge("weather_specialist", END)
    graph.add_edge("booking_specialist", END)
    return graph.compile()


def run() -> dict:
    graph = build()
    weather = graph.invoke(
        {
            "goal": "Should I pack an umbrella for Tokyo this weekend?",
            "specialist": "",
            "allowed": [],
            "answer": "",
        }
    )
    booking = graph.invoke(
        {
            "goal": "Reserve a room for 4 with a whiteboard",
            "specialist": "",
            "allowed": [],
            "answer": "",
        }
    )
    return {
        "weather_specialist": weather["specialist"],
        "weather_answer": weather["answer"],
        "weather_allowed": weather["allowed"],
        "booking_specialist": booking["specialist"],
        "booking_answer": booking["answer"],
        "booking_allowed": booking["allowed"],
    }


if __name__ == "__main__":
    print(run())
