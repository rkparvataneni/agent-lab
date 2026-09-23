# Agentic Lab — developer track

You already know what an agent loop, a tool, and ReAct are. These ten modules are the decisions you still have to make before a graph survives contact with production.

The chat model is scripted (`agentic_lab/llm.py`). It speaks the real tool-call protocol. When you have a key, replace `ScriptedChatModel` with `ChatOpenAI` or `ChatAnthropic`. Do not rewrite the edges.

## Setup

macOS and Linux:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows Command Prompt:

```bat
cd python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

macOS and Linux:

```bash
PYTHONPATH=. python -m agentic_lab list
PYTHONPATH=. python -m agentic_lab 04
PYTHONPATH=. python -m pytest
```

Windows Command Prompt:

```bat
set PYTHONPATH=.
python -m agentic_lab list
python -m agentic_lab 04
python -m pytest
```

## Syllabus

| # | Lesson | What you lock down |
|---|--------|--------------------|
| 01 | Evidence gate | No observation in state, no final answer |
| 02 | Routers and reducers | The next node is a pure function of state; logs append |
| 03 | Tool contracts | Side effect, error class, and which classes must not retry |
| 04 | Loop guards | A repeated `(tool, args)` fingerprint stops the cycle |
| 05 | Harness boundary | `create_agent` plus an assertion the harness will not make |
| 06 | Thread vs store | `thread_id` is the conversation; a store is a fact you chose |
| 07 | Failure policy | Timeout retries once, conflict replans, denial escalates |
| 08 | Approve, then write | `interrupt()` before the side effect; the write is idempotent |
| 09 | Handoff contracts | The supervisor passes an allow-list; the specialist does not pick tools |
| 10 | Trajectory evals | The message order is the fixture, not the final sentence |

## How the pieces fit

```
Your policy        edges, error classes, budgets, allow-lists, evals
LangGraph          StateGraph, reducers, checkpointers, interrupt, subgraphs
LangChain          model I/O, @tool, create_agent when the policy is that simple
```

`create_agent` is enough when the job is model + tools + a thread, and you still assert the tools ran. Write a `StateGraph` when a step must be deterministic: evidence gate, planner, supervisor, approval.

## Swap in a real model

```python
from langchain_openai import ChatOpenAI
# pip install langchain-openai
model = ChatOpenAI(model="gpt-4.1-mini")
```

Pass `model` into `create_agent(...)` or `.bind_tools(tools)` in lesson 04. Keep the tools, the guards, the checkpointer, and the interrupts.

Official docs: [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents) ·
[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)
