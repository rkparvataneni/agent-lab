"""05 · create_agent harness

LangChain 1.x ships create_agent on top of LangGraph. Same loop as lesson 04,
plus a system prompt and a middleware stack you can extend.

Use create_agent when the job is "model + tools + memory + a bit of policy."
Drop to StateGraph when you need a planner node, a supervisor, or a
deterministic branch the model should not vote on.
"""

from __future__ import annotations

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import calculator, search

SLUG = "create-agent"
TITLE = "create_agent harness"
FILE = "l05_create_agent.py"

GOAL = "What's a 17% tip on an $86 dinner, and is Katsu House still open?"


def build():
    return create_agent(
        model=ScriptedChatModel(mission="dinner-tip"),
        tools=[calculator, search],
        system_prompt=(
            "You are a restaurant helper. Compute the tip with the calculator. "
            "Look up hours with search. Do not guess either number."
        ),
    )


def run() -> dict:
    result = build().invoke({"messages": [HumanMessage(content=GOAL)]})
    messages = result["messages"]
    return {
        "goal": GOAL,
        "answer": messages[-1].content,
        "used": sorted(
            {
                getattr(m, "name", "")
                for m in messages
                if getattr(m, "name", "") in {"calculator", "search"}
            }
        ),
    }


if __name__ == "__main__":
    print(run())
