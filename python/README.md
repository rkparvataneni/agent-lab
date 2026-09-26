# Agentic Lab — expert course

You already know what an agent loop, a tool, and ReAct are. These twenty-seven modules are the loop written by hand, then the failures a real model adds: uncited numbers, sampling controls, rate limits, a full context window, instructions hiding in tool output, a crash between the side effect and the checkpoint, a tool call that violates the protocol, evidence that disagrees, a judge that likes fluent prose, a store that remembers a lie, an argument that should never reach the provider, and a trace you can price and roll back. The graph lessons are the policy you put around that loop.

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
| 11 | Hand-code the loop | No StateGraph. You dispatch tools and copy tool_call_id |
| 12 | Hallucination | Answer numbers must come from the user or a tool message |
| 13 | Sampling controls | temperature, top_p, top_k, max_tokens. A TPU is not a knob |
| 14 | Rate limits | RPM, TPM, one Retry-After, no retry on policy |
| 15 | Context and injection | Trim old turns. Tool text is data. length is not a tool call |
| 16 | Ask, do not invent | Empty slots ask once. Fixtures are not defaults |
| 17 | Partial tool failure | Keep the successful tool. Retry only the failed name |
| 18 | Budgets and routing | Small model routes. An estimate that does not fit is not sent |
| 19 | Credentials | The token is attached by the runtime. A wider scope is denied |
| 20 | A trace you can defend | Name the failed span. Known steps are a workflow |
| 21 | Crash and resume | Reuse the idempotency key. A new key is a second charge |
| 22 | Protocol violations | length, unknown tools, and a mismatched id are not executed |
| 23 | Conflicting evidence | Disagreeing tools stay disagreeing. A stale cache is a miss |
| 24 | Judges and schemas | Fluency passes a guess. Parse the amount from model text |
| 25 | Memory write policy | A summary is not an observation. A stored lie comes back |
| 26 | Unsafe tools | Deny the metadata URL, a path escape, and a secret in the args |
| 27 | Cost, redaction, rollback | Price the spans, redact sk-, blame the slow tool, serve the previous graph |

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
