"""01 · Chain vs graph

LangChain shines at composing a model call: prompt → model → parser.
That is a chain. One shot. No durable state.

LangGraph is for when the next step depends on the last observation:
loop, branch, retry, pause for a human, resume tomorrow.

You will use both. Chains inside nodes. A graph around the job.
"""

from __future__ import annotations

from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph

SLUG = "chain-vs-graph"
TITLE = "Chain vs graph"
FILE = "l01_chain_vs_graph.py"


class ChainState(TypedDict):
    question: str
    draft: str
    answer: str


def chain_once(question: str) -> str:
    """A one-shot completion. This is a chatbot, not an agent."""
    return (
        "I don't have live weather. Tokyo can be rainy in September, "
        "so you might pack an umbrella — that's a guess."
    )


def draft_node(state: ChainState) -> dict[str, str]:
    return {"draft": chain_once(state["question"])}


def critique_node(state: ChainState) -> dict[str, str]:
    # A second node can refuse the guess. A chain cannot come back.
    return {
        "answer": (
            "The draft guessed. Stop. Attach a weather tool and run a graph "
            "that can observe a forecast before answering."
        )
    }


def build():
    graph = StateGraph(ChainState)
    graph.add_node("draft", draft_node)
    graph.add_node("critique", critique_node)
    graph.add_edge(START, "draft")
    graph.add_edge("draft", "critique")
    graph.add_edge("critique", END)
    return graph.compile()


def run() -> dict:
    question = "Should I pack an umbrella for Tokyo this weekend?"
    chain = chain_once(question)
    graph = build().invoke({"question": question, "draft": "", "answer": ""})
    return {
        "question": question,
        "chain": chain,
        "graph_answer": graph["answer"],
        "messages": [
            HumanMessage(content=question),
            AIMessage(content=graph["answer"]),
        ],
    }


if __name__ == "__main__":
    result = run()
    print("CHAIN:", result["chain"])
    print("GRAPH:", result["graph_answer"])
