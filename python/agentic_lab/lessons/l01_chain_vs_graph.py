"""01 · Evidence gate

A chain is one model call with one exit: the text it produced.
A graph is a control policy. The model may draft. An edge you wrote
decides whether that draft is allowed to become the answer.

Invariant: no observation in state, no final answer.
Keep the one-shot call as a node. Do not let it be the job.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph

SLUG = "chain-vs-graph"
TITLE = "Evidence gate"
FILE = "l01_chain_vs_graph.py"


class Job(TypedDict):
    question: str
    draft: str
    evidence: str
    answer: str


def chain_once(question: str) -> str:
    """One completion. Nothing in this function can reject its own text."""
    return (
        "I don't have live weather. Tokyo can be rainy in September, "
        "so you might pack an umbrella — that's a guess."
    )


def draft_node(state: Job) -> dict[str, str]:
    return {"draft": chain_once(state["question"])}


def route(state: Job) -> Literal["answer", "refuse"]:
    """Code owns this edge. The draft does not get a vote."""
    return "answer" if state["evidence"].strip() else "refuse"


def answer_node(state: Job) -> dict[str, str]:
    return {"answer": f"Grounded in the forecast: {state['evidence']}"}


def refuse_node(state: Job) -> dict[str, str]:
    return {
        "answer": (
            "The draft guessed. Stop. Attach a weather tool and run a graph "
            "that can observe a forecast before answering."
        )
    }


def build():
    graph = StateGraph(Job)
    graph.add_node("draft", draft_node)
    graph.add_node("answer", answer_node)
    graph.add_node("refuse", refuse_node)
    graph.add_edge(START, "draft")
    graph.add_conditional_edges("draft", route)
    graph.add_edge("answer", END)
    graph.add_edge("refuse", END)
    return graph.compile()


def run() -> dict:
    question = "Should I pack an umbrella for Tokyo this weekend?"
    chain = chain_once(question)
    graph = build().invoke(
        {"question": question, "draft": "", "evidence": "", "answer": ""}
    )
    return {
        "question": question,
        "chain": chain,
        "graph_answer": graph["answer"],
        "routed": "answer" if graph["evidence"].strip() else "refuse",
        "evidence": graph["evidence"],
        "messages": [
            HumanMessage(content=question),
            AIMessage(content=graph["answer"]),
        ],
    }


if __name__ == "__main__":
    result = run()
    print("CHAIN:", result["chain"])
    print("GRAPH:", result["graph_answer"])
    print("ROUTED:", result["routed"])
