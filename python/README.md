# Agentic Lab — developer track

This is the code path. The Next.js studio teaches the *ideas*. These ten Python
modules teach the *graphs* you will actually ship with **LangChain 1.x** and
**LangGraph 1.x**.

The chat model is scripted (`agentic_lab/llm.py`). It speaks the real tool-call
protocol. When you have a key, replace `ScriptedChatModel` with `ChatOpenAI` or
`ChatAnthropic`. Do not rewrite the graph.

## Setup

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

```bash
PYTHONPATH=. python -m agentic_lab list
PYTHONPATH=. python -m agentic_lab 04
PYTHONPATH=. python -m pytest
```

## Syllabus

| # | Lesson | What you build |
|---|--------|----------------|
| 01 | Chain vs graph | One-shot completion vs a two-node graph that refuses to guess |
| 02 | StateGraph | Typed state, nodes, conditional edges |
| 03 | Tools | `@tool`, schemas, invoke, reject unsafe calculator input |
| 04 | Hand-built ReAct | `MessagesState` + `ToolNode` + `tools_condition` |
| 05 | `create_agent` | The official harness on top of that same loop |
| 06 | Memory | `InMemorySaver` + `thread_id` |
| 07 | Plan / replan | Deterministic plan in state; replan when East is held |
| 08 | Human-in-the-loop | `interrupt()` then `Command(resume=...)` |
| 09 | Multi-agent | Supervisor routes to weather vs booking subgraphs |
| 10 | Production | Pydantic output + eval suite you can put in CI |

## How the pieces fit

```
LangChain          model I/O, @tool, create_agent
LangGraph          StateGraph, checkpointers, interrupt, subgraphs
Your code          tools, policy nodes, evals, permissions
```

`create_agent` is enough when the job is model + tools + memory.
Write a `StateGraph` when a step must be deterministic (planner, supervisor,
approval gate).

## Swap in a real model

```python
from langchain_openai import ChatOpenAI
# pip install langchain-openai
model = ChatOpenAI(model="gpt-4.1-mini")
```

Pass `model` into `create_agent(...)` or `.bind_tools(tools)` in lesson 04.
Keep the tools, checkpointer, and interrupts.

Official docs: [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents) ·
[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)
