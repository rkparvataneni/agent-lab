"""06 · Thread vs store

InMemorySaver under a thread_id is the conversation. It grows when the
same thread continues, and a new thread_id is a new life. Production
swaps in PostgresSaver. The invoke config does not change.

That object is not long-term memory. A store is a fact you chose to keep,
keyed so a later thread can query it. Do not dump tool transcripts into
the store. Do not read another thread to simulate recall.

Invariant: thread isolation and store recall are different reads.
"""

from __future__ import annotations

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from agentic_lab.llm import ScriptedChatModel
from agentic_lab.tools import weather

SLUG = "memory"
TITLE = "Thread vs store"
FILE = "l06_memory.py"


def build(checkpointer: InMemorySaver):
    return create_agent(
        model=ScriptedChatModel(mission="tokyo-weekend"),
        tools=[weather],
        checkpointer=checkpointer,
        system_prompt="Use observations already in this thread. Do not invent a forecast.",
    )


def _forecast(messages: list) -> str:
    for message in messages:
        if isinstance(message, ToolMessage) and message.name == "weather":
            return str(message.content)
    return ""


def run() -> dict:
    memory = InMemorySaver()
    agent = build(memory)
    store: dict[str, str] = {}
    config = {"configurable": {"thread_id": "trip-tokyo"}}
    first = agent.invoke(
        {"messages": [HumanMessage(content="Should I pack an umbrella for Tokyo this weekend?")]},
        config,
    )
    fact = _forecast(first["messages"])
    if fact:
        store["tokyo-weekend"] = fact
    second = agent.invoke(
        {"messages": [HumanMessage(content="Remind me what you already know about Tokyo.")]},
        config,
    )
    fresh = agent.invoke(
        {"messages": [HumanMessage(content="Should I pack an umbrella for Tokyo this weekend?")]},
        {"configurable": {"thread_id": "someone-else"}},
    )
    recalled = store.get("tokyo-weekend", "")
    return {
        "first_len": len(first["messages"]),
        "second_len": len(second["messages"]),
        "fresh_len": len(fresh["messages"]),
        "same_thread_grew": len(second["messages"]) > len(first["messages"]),
        "second_answer": second["messages"][-1].content,
        "store_has_forecast": "70%" in recalled,
        "fresh_thread_misses_store": "someone-else" not in store,
    }


if __name__ == "__main__":
    print(run())
