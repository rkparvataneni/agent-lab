# Agentic Lab

An expert track. It assumes you already know the loop, tools, ReAct, and what a checkpointer is. The work is the control policy you put around them.

1. **Design studio** (Next.js) — watch an evidence gate, a broken tool contract, a store hit, and a failure class. No API key.
2. **Developer track** (Python) — the same decisions in **LangGraph**: routers, contracts, loop guards, a store, approval before writes, handoff allow-lists, and trajectory evals.

## Design studio

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

macOS and Linux:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python -m agentic_lab list
PYTHONPATH=. python -m pytest
```

Windows Command Prompt (`source` does not exist there):

```bat
cd python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set PYTHONPATH=.
python -m agentic_lab list
python -m pytest
```

Full syllabus: [`python/README.md`](python/README.md).

The model is scripted (`python/agentic_lab/llm.py`) so every lesson is deterministic. Swap it for `ChatOpenAI` when you have a key. The edges stay.

## What you practice, in order

| Design studio | Code (Python) |
|---------------|----------------|
| Control policy | 01 evidence gate, 02 routers and reducers |
| Tool contracts | 03 error class and retry rule |
| Loop guards | 04 fingerprint stop, 05 harness boundary |
| Context engineering | 06 thread vs store |
| Failure policy | 07 retry, replan, escalate |
| — | 08 approve then write, 09 handoff contracts, 10 trajectory evals |
