"""04 · Loop guards

The ReAct cycle is still model ⇄ tools until there are no tool_calls.
Two policies sit on top of that cycle before you trust it with a budget:

- recursion_limit is the backstop, not the design
- a fingerprint of (tool name, args) stops a repeated call

A second identical call is a loop. Stop it. Replan or escalate.
Do not hope the next thought will be wiser.

create_agent is this graph plus middleware. If the guard is not in
the graph, the harness will not invent it.
"""

from __future__ import annotations

import json
import operator
from typing import Annotated, Literal

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import weather

SLUG = "react-graph"
TITLE = "Loop guards"
FILE = "l04_react_graph.py"

GOAL = "Should I pack an umbrella for Tokyo this weekend?"


class LoopState(MessagesState):
    calls: Annotated[list[str], operator.add]


class RepeatingWeather(ScriptedChatModel):
    """Calls weather again after the observation. The guard must stop it."""

    def _decide(self, user: str, messages: list[BaseMessage]) -> AIMessage:
        seen = sum(1 for message in messages if isinstance(message, ToolMessage) and message.name == "weather")
        if seen < 2:
            return self._call("weather", {"city": "Tokyo", "when": "weekend"})
        return AIMessage(content="Still calling weather.")


def _fingerprint(message: AIMessage) -> str | None:
    calls = getattr(message, "tool_calls", None) or []
    if not calls:
        return None
    call = calls[0]
    args = json.dumps(call.get("args", {}), sort_keys=True, default=str)
    return f"{call['name']}:{args}"


def build(model: ScriptedChatModel | None = None):
    llm = (model or ScriptedChatModel(mission="tokyo-weekend")).bind_tools([weather])

    def call_model(state: LoopState) -> dict:
        message = llm.invoke(state["messages"])
        update: dict = {"messages": [message]}
        fingerprint = _fingerprint(message)
        if fingerprint:
            update["calls"] = [fingerprint]
        return update

    def route(state: LoopState) -> Literal["tools", "stop", "end"]:
        last = state["messages"][-1]
        if not getattr(last, "tool_calls", None):
            return "end"
        fingerprint = _fingerprint(last)
        prior = state.get("calls", [])[:-1]
        if fingerprint and fingerprint in prior:
            return "stop"
        return "tools"

    def stop(state: LoopState) -> dict:
        return {
            "messages": [
                AIMessage(
                    content="Stopped: same tool call repeated. Do not spend another step on it."
                )
            ]
        }

    graph = StateGraph(LoopState)
    graph.add_node("model", call_model)
    graph.add_node("tools", ToolNode([weather]))
    graph.add_node("stop", stop)
    graph.add_edge(START, "model")
    graph.add_conditional_edges(
        "model",
        route,
        {"tools": "tools", "stop": "stop", "end": END},
    )
    graph.add_edge("tools", "model")
    graph.add_edge("stop", END)
    return graph.compile()


def _invoke(model: ScriptedChatModel | None = None) -> dict:
    return build(model).invoke(
        {"messages": [HumanMessage(content=GOAL)], "calls": []},
        {"recursion_limit": 6},
    )


def run() -> dict:
    result = _invoke()
    messages = result["messages"]
    looping = _invoke(RepeatingWeather(mission="tokyo-weekend"))
    loop_messages = looping["messages"]
    return {
        "goal": GOAL,
        "steps": [type(message).__name__ for message in messages],
        "answer": messages[-1].content,
        "tool_used": any(getattr(message, "name", None) == "weather" for message in messages),
        "loop_stopped": "Stopped:" in str(loop_messages[-1].content),
        "loop_tool_calls": sum(
            1 for message in loop_messages if isinstance(message, ToolMessage)
        ),
    }


if __name__ == "__main__":
    print(run())
