# Agentic Lab

Expert agent course. You leave able to hand-code an agent and to name the failures that show up once it is on a real model: hallucination, sampling controls, rate limits, context, and injection.

1. **Design studio** (Next.js) — twenty-seven lessons. Watch the loop, an ungrounded answer, a hot sample, a truncated tool call, a 429, a rejected write, a bad handoff, a failed eval, an injected tool result, a second charge after a crash, a sliced tool call, a bad citation, a fluency judge, a poisoned store, an unsafe argument, and a secret left in a span. No API key.
2. **Expert course** (Python) — the same ideas as code you run: a hand-written loop, citation checks, temperature and top_p, RPM/TPM, then the LangGraph policies around them. Numbering differs; the table below is the map.

## Design studio

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

- `/` path
- `/lesson/loop` … `/lesson/operate`
- `/playground`
- `/build` — the twenty-seven Python lessons, source on the page, each one linked to its design studio

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
| 01 Control policy | 01 evidence gate |
| 02 Tool contracts | 03 error class and retry rule |
| 03 Loop guards | 04 fingerprint stop |
| 04 Context engineering | 06 thread vs store |
| 05 Failure policy | 07 retry, replan, escalate |
| 06 Hand-code the loop | 11 messages, dispatch, tool_call_id |
| 07 Hallucination | 12 numbers must be cited |
| 08 Sampling controls | 13 temperature, top_p, top_k, max_tokens |
| 09 Rate limits | 14 RPM, TPM, Retry-After |
| 10 Ask, do not invent | 16 one question, no invented slot |
| 11 Partial failure | 17 keep the success, retry the failure |
| 12 Budgets and routing | 18 small model, hard token ceiling |
| 13 Credentials | 19 token stays off the prompt |
| 14 A trace you can defend | 20 blame the span; workflow if the steps are known |
| 15 Routers | 02 the next node is a pure function of state |
| 16 Harness boundary | 05 `create_agent` plus the assertion it will not make |
| 17 Approve, then write | 08 interrupt before the write; the write is idempotent |
| 18 Handoff contracts | 09 the ticket is an allow-list |
| 19 Trajectory evals | 10 the message order is the fixture |
| 20 Context and injection | 15 trim old turns; tool text is data |
| 21 Crash and resume | 21 reuse the idempotency key after the checkpoint is lost |
| 22 Protocol violations | 22 sliced calls, unknown tools, and mismatched ids are not executed |
| 23 Conflicting evidence | 23 disagreeing observations, stale cache, citation target |
| 24 Judges and schemas | 24 fluency is not groundedness; parse the schema from the model text |
| 25 Memory write policy | 25 a summary is not an observation |
| 26 Unsafe tools | 26 the allow-list does not make an argument safe |
| 27 Cost, redaction, rollback | 27 price the spans, redact the secret, serve the previous graph |
