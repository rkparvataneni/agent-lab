# Agentic Lab

A short workshop for **agentic AI development**. Five lessons walk the same idea from different sides: an agent is a loop around a model that can use tools, remember facts, and recover when the world says no.

The studio on each page is a **simulated agent**. It is deterministic on purpose. You can step a trace like a debugger, strip a tool and watch it stall, and rerun a booking after a conflict. No API key is required.

## Lessons

1. **The agent loop** — chatbot vs agent on the same question
2. **Tools** — schemas you execute, arguments the model proposes
3. **ReAct** — thought → action → observation
4. **Memory** — history, scratchpad, and notes worth keeping
5. **Plan, then recover** — write steps, then replan when a room is taken

The **playground** exposes every switch on the same runtime.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

```bash
npm test    # simulated runtime
npm run build
```

## How the agent is faked

`src/lib/agent/runtime.ts` is a small, readable stand-in for an LLM plus tool host. Missions live in `src/lib/agent/missions.ts`. Lesson copy lives in `src/lib/lessons.ts`. When you later swap this for a real model, keep the same step kinds (`thought`, `action`, `observation`, `plan`, `replan`, `memory`, `answer`, `error`) so the trace UI still works.
