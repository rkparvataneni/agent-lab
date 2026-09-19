# Agentic Lab

Two tracks, one repo.

1. **Concept studio** (Next.js) — watch a simulated agent think, call tools, stall, remember, and recover. No API key.
2. **Developer track** (Python) — build the same jobs with **LangChain 1.x** and **LangGraph 1.x**: `StateGraph`, tools, `create_agent`, checkpoints, interrupts, a supervisor, and CI evals.

## Concept studio

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

- `/` path
- `/lesson/loop` … `/lesson/planning`
- `/playground`
- `/build` — the LangGraph syllabus, with the real Python source on each page

```bash
npm test
npm run build
```

## Developer track

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=. python -m agentic_lab list
PYTHONPATH=. python -m agentic_lab 04
PYTHONPATH=. python -m pytest
```

Full syllabus: [`python/README.md`](python/README.md).

The model is scripted (`python/agentic_lab/llm.py`) so every lesson is deterministic. Swap it for `ChatOpenAI` when you have a key. The graph stays.

## What to learn, in order

| Concepts (studio) | Code (Python) |
|-------------------|----------------|
| Chatbot vs agent | 01 chain vs graph, 02 StateGraph |
| Tools | 03 `@tool` |
| ReAct | 04 hand-built graph, 05 `create_agent` |
| Memory | 06 checkpointer + `thread_id` |
| Plan / recover | 07 plan-execute-replan |
| — | 08 human-in-the-loop, 09 multi-agent, 10 production evals |
