# Agentic Lab

Expert agent course. You leave able to hand-code an agent and to name the failures that show up once it is on a real model: hallucination, sampling controls, rate limits, context, and injection.

1. **Design studio** (Next.js) — watch the loop, an ungrounded answer, a hot sample, a truncated tool call, and a 429. No API key.
2. **Expert course** (Python) — the same lessons as code you run: a hand-written loop, citation checks, temperature and top_p, RPM/TPM, then the LangGraph policies around them.

## Design studio

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

- `/` path
- `/lesson/loop` … `/lesson/injection`
- `/playground`
- `/build` — the LangGraph syllabus, with the real Python source on each page

```bash
npm test
npm run build
```

## Expert course

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
| Hand-code the loop | 11 messages, dispatch, tool_call_id |
| Hallucination | 12 numbers must be cited |
| Sampling controls | 13 temperature, top_p, top_k, max_tokens |
| Rate limits | 14 RPM, TPM, Retry-After |
| Ask, do not invent | 16 one question, no invented slot |
| Partial failure | 17 keep the success, retry the failure |
| Budgets and routing | 18 small model, hard token ceiling |
| Credentials | 19 token stays off the prompt |
| A trace you can defend | 20 blame the span; workflow if the steps are known |
| Routers, harness, approval, handoff, evals, injection | Studio 15–20, the same ideas as Python 02, 05, 08, 09, 10, and 15 |
| — | 08 approve then write, 09 handoff contracts, 10 trajectory evals, 15 context and injection |
