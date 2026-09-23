"""05 · Harness boundary

create_agent is the lesson 04 loop plus a system prompt.
Use it when the policy really is "this model, these tools, this thread."

The harness will not notice that the model answered before both tools ran.
That check stays in your code. When a step must be deterministic —
planner, supervisor, approval gate — leave the harness and write the node.
"""

from __future__ import annotations

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import calculator, search

SLUG = "create-agent"
TITLE = "Harness boundary"
FILE = "l05_create_agent.py"

GOAL = "What's a 17% tip on an $86 dinner, and is Katsu House still open?"
REQUIRED = ("calculator", "search")


def build():
    return create_agent(
        model=ScriptedChatModel(mission="dinner-tip"),
        tools=[calculator, search],
        system_prompt=(
            "You are a restaurant helper. Compute the tip with the calculator. "
            "Look up hours with search. Do not guess either number."
        ),
    )


def grounded(messages: list) -> bool:
    """Both required tools must have returned before the final answer."""
    names = [getattr(message, "name", "") for message in messages]
    if any(name not in names for name in REQUIRED):
        return False
    last = len(messages) - 1
    tool_at = [index for index, name in enumerate(names) if name in REQUIRED]
    return bool(tool_at) and max(tool_at) < last and bool(getattr(messages[last], "content", ""))


def run() -> dict:
    result = build().invoke({"messages": [HumanMessage(content=GOAL)]})
    messages = result["messages"]
    return {
        "goal": GOAL,
        "answer": messages[-1].content,
        "used": sorted({name for name in (getattr(m, "name", "") for m in messages) if name in REQUIRED}),
        "grounded": grounded(messages),
    }


if __name__ == "__main__":
    print(run())
