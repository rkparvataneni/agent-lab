"""06 · Checkpoints and thread memory

Without a checkpointer, every invoke starts empty.
InMemorySaver stores the graph state under a thread_id.

Same thread_id → the next invoke sees prior messages.
Different thread_id → a new conversation.

Production: PostgresSaver / SqliteSaver. Same interface.
The store (long-term facts) is a separate object from the checkpointer
(this-run / this-thread state). Don't dump tool transcripts into a vector DB.
"""

from __future__ import annotations

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import weather

SLUG = "memory"
TITLE = "Checkpoints and memory"
FILE = "l06_memory.py"


def build(checkpointer: InMemorySaver):
    return create_agent(
        model=ScriptedChatModel(mission="tokyo-weekend"),
        tools=[weather],
        checkpointer=checkpointer,
        system_prompt="Remember facts already observed in this thread.",
    )


def run() -> dict:
    memory = InMemorySaver()
    agent = build(memory)
    config = {"configurable": {"thread_id": "trip-tokyo"}}
    first = agent.invoke(
        {"messages": [HumanMessage(content="Should I pack an umbrella for Tokyo this weekend?")]},
        config,
    )
    second = agent.invoke(
        {"messages": [HumanMessage(content="Remind me what you already know about Tokyo.")]},
        config,
    )
    fresh = agent.invoke(
        {"messages": [HumanMessage(content="Should I pack an umbrella for Tokyo this weekend?")]},
        {"configurable": {"thread_id": "someone-else"}},
    )
    return {
        "first_len": len(first["messages"]),
        "second_len": len(second["messages"]),
        "fresh_len": len(fresh["messages"]),
        "same_thread_grew": len(second["messages"]) > len(first["messages"]),
        "second_answer": second["messages"][-1].content,
    }


if __name__ == "__main__":
    print(run())
