"""09 · Multi-agent (supervisor)

A specialist is just a compiled graph you call from a node.
A supervisor is a router: it reads the goal and Sends work to one subgraph.

Don't spawn agents for vibe. Split when tools, prompts, or permissions differ.
Here: weather specialist vs booking specialist. The supervisor never holds
both toolboxes at once, so the weather model cannot "accidentally" reserve
a room.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, StateGraph

from agentic_lab.lessons.l04_react_graph import build as weather_graph
from agentic_lab.lessons.l07_plan_replan import build as booking_graph

SLUG = "multi-agent"
TITLE = "Multi-agent supervisor"
FILE = "l09_multi_agent.py"


class Ticket(TypedDict):
    goal: str
    specialist: str
    answer: str


def supervisor(state: Ticket) -> dict[str, str]:
    goal = state["goal"].lower()
    specialist = "booking" if "room" in goal or "whiteboard" in goal else "weather"
    return {"specialist": specialist}


def route(state: Ticket) -> Literal["weather_specialist", "booking_specialist"]:
    return "booking_specialist" if state["specialist"] == "booking" else "weather_specialist"


def weather_specialist(state: Ticket) -> dict[str, str]:
    result = weather_graph().invoke({"messages": [HumanMessage(content=state["goal"])]})
    return {"answer": result["messages"][-1].content}


def booking_specialist(state: Ticket) -> dict[str, str]:
    result = booking_graph().invoke(
        {
            "goal": state["goal"],
            "plan": [],
            "east_held": True,
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
        {"goal": "Should I pack an umbrella for Tokyo this weekend?", "specialist": "", "answer": ""}
    )
    booking = graph.invoke(
        {"goal": "Reserve a room for 4 with a whiteboard", "specialist": "", "answer": ""}
    )
    return {
        "weather_specialist": weather["specialist"],
        "weather_answer": weather["answer"],
        "booking_specialist": booking["specialist"],
        "booking_answer": booking["answer"],
    }


if __name__ == "__main__":
    print(run())
