"""04 · Hand-built ReAct graph

This is the graph you should be able to draw from memory:

  START → model ──(tool_calls?)──► tools ──► model ──► END
                └──(no calls)───────────────► END

LangGraph's ToolNode runs every tool_call on the last AIMessage.
tools_condition is the stock router: tools vs END.

After this lesson, create_agent will make more sense: it is this graph
plus middleware, not a different religion.
"""

from __future__ import annotations

from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import weather

SLUG = "react-graph"
TITLE = "Hand-built ReAct graph"
FILE = "l04_react_graph.py"

GOAL = "Should I pack an umbrella for Tokyo this weekend?"


def build(model: ScriptedChatModel | None = None):
    model = (model or ScriptedChatModel(mission="tokyo-weekend")).bind_tools([weather])
    graph = StateGraph(MessagesState)
    graph.add_node("model", lambda state: {"messages": [model.invoke(state["messages"])]})
    graph.add_node("tools", ToolNode([weather]))
    graph.add_edge(START, "model")
    graph.add_conditional_edges("model", tools_condition)
    graph.add_edge("tools", "model")
    return graph.compile()


def run() -> dict:
    result = build().invoke({"messages": [HumanMessage(content=GOAL)]})
    messages = result["messages"]
    return {
        "goal": GOAL,
        "steps": [type(m).__name__ for m in messages],
        "answer": messages[-1].content,
        "tool_used": any(getattr(m, "name", None) == "weather" for m in messages),
    }


if __name__ == "__main__":
    print(run())
