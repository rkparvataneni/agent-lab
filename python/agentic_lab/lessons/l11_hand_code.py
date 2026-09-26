"""11 · Hand-code the loop

No StateGraph. This is the program a framework compiles:

    messages = [HumanMessage(goal)]
    while you still have a step budget:
        ai = model.invoke(messages)
        messages.append(ai)
        if not ai.tool_calls:
            return ai.content
        for call in ai.tool_calls:
            result = tools[call["name"]].invoke(call["args"])
            messages.append(ToolMessage(..., tool_call_id=call["id"]))

Your process executes tools. The model only proposes a name and arguments.
A tool message that does not carry the assistant's tool_call_id is not a
valid transcript. Parallel calls are several tool messages before the next
model call.
"""

from __future__ import annotations

from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import weather

SLUG = "hand-code"
TITLE = "Hand-code the loop"
FILE = "l11_hand_code.py"

GOAL = "Should I pack an umbrella for Tokyo this weekend?"


def run_hand_coded(goal: str = GOAL, budget: int = 4) -> dict:
    model = ScriptedChatModel(mission="tokyo-weekend")
    tools = {"weather": weather}
    messages: list[BaseMessage] = [HumanMessage(content=goal)]
    roles = ["human"]

    for _ in range(budget):
        ai = model.invoke(messages)
        messages.append(ai)
        roles.append("ai")
        calls = getattr(ai, "tool_calls", None) or []
        if not calls:
            return {
                "answer": str(ai.content),
                "roles": roles,
                "tool_messages": sum(isinstance(m, ToolMessage) for m in messages),
                "framework": None,
            }
        for call in calls:
            result = tools[call["name"]].invoke(call["args"])
            messages.append(
                ToolMessage(content=str(result), tool_call_id=call["id"], name=call["name"])
            )
            roles.append("tool")

    raise RuntimeError("step budget exhausted before an answer")


def run() -> dict:
    result = run_hand_coded()
    result["hand_coded"] = True
    return result
