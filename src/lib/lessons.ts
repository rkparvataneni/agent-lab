import type { MissionId, ToolName } from "./agent/types";

export const LESSON_SLUGS = [
  "loop",
  "tools",
  "react",
  "memory",
  "planning",
] as const;

export type LessonSlug = (typeof LESSON_SLUGS)[number];

export type LessonDemo = {
  missionId: MissionId;
  compareChatbot: boolean;
  allowToolToggle: boolean;
  showMemoryToggle: boolean;
  showPlanningToggle: boolean;
  showFailureToggle: boolean;
  dualRun: boolean;
  defaultTools?: Partial<Record<ToolName, boolean>>;
  defaultMemory?: boolean;
  defaultPlanning?: boolean;
  defaultFailure?: boolean;
};

export type Lesson = {
  slug: LessonSlug;
  number: string;
  title: string;
  duration: string;
  summary: string;
  concept: {
    heading: string;
    paragraphs: string[];
    takeaways: string[];
  };
  code: {
    title: string;
    source: string;
  };
  demo: LessonDemo;
  studioHint: string;
};

export const LESSONS: Lesson[] = [
  {
    slug: "loop",
    number: "01",
    title: "Control policy",
    duration: "12 min",
    summary:
      "The model may propose the next action. An edge you wrote decides whether an answer is allowed to leave.",
    concept: {
      heading: "The edge is the product",
      paragraphs: [
        "You already know the loop: propose, act, observe, repeat. The decision that separates a demo from a system you can own is who is allowed to end it. A one-shot completion has a single exit, whatever the model wrote. A graph you can ship has an exit condition in code, usually “every required fact is an observation in state.”",
        "Prompts ask. Edges commit. The model can still pick a bad tool, and that is a description or a router bug. It must not be able to promote a draft into a final answer when the forecast was never fetched. Temperature will not fix that. A missing precondition will.",
        "Run the packing question both ways. The completion hedges, because nothing in that call can reject its own text. The graph keeps the answer edge closed until weather returns. Same model behavior, different control policy.",
      ],
      takeaways: [
        "An answer is a state transition with a precondition.",
        "Keep the one-shot call as a node. Do not let it be the job.",
        "If the model answered without evidence, the bug is the edge.",
      ],
    },
    code: {
      title: "Refuse until the observation exists",
      source: `function route(state: { evidence: string }) {
  return state.evidence.trim() ? "answer" : "refuse"
}

// draft is a node. It does not get a vote on route().
graph.addConditionalEdges("draft", route)`,
    },
    demo: {
      missionId: "tokyo-weekend",
      compareChatbot: true,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      dualRun: false,
    },
    studioHint:
      "Run both. The completion guesses. The graph stays on the refuse edge until weather is in state.",
  },
  {
    slug: "tools",
    number: "02",
    title: "Tool contracts",
    duration: "12 min",
    summary:
      "A schema is not a contract. You still declare the side effect, the error class, and whether that class is allowed to retry.",
    concept: {
      heading: "Classify the failure before you call again",
      paragraphs: [
        "You already know the model emits {name, args} and your runtime executes. What usually ships underspecified is the rest of the contract: read or write, idempotent or not, and an error class. ok, policy, not_found, failed, and timeout are different edges.",
        "Policy means the call was illegal: rejected calculator input, a tool that is not bound. Do not retry it. not_found means the index was empty. Do not invent a substitute fact. failed and timeout are the only classes you retry, and only inside a budget. A missing tool is a broken contract, so the run stops.",
        "Strip calculator or search on the dinner check. The trace should block on the missing half. A 17% tip the model “roughly” knows is a policy failure, not a helpful completion. If rooms is bound, assume it will be called. Least privilege is which tools you attach, not a sentence in the prompt.",
      ],
      takeaways: [
        "Every tool declares side effect, idempotency, and error class.",
        "Policy and not_found are not retries.",
        "If the tool is bound, assume the model will call it.",
      ],
    },
    code: {
      title: "Retry is a property of the error class",
      source: `type ErrorClass = "ok" | "policy" | "not_found" | "failed" | "timeout"

function retryable(kind: ErrorClass) {
  return kind === "failed" || kind === "timeout"
}

// "Rejected: ..." is policy. A second identical call will not make it legal.`,
    },
    demo: {
      missionId: "dinner-tip",
      compareChatbot: false,
      allowToolToggle: true,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      dualRun: false,
      defaultTools: {
        weather: false,
        calculator: true,
        search: true,
        calendar: false,
        rooms: false,
        notes: false,
      },
    },
    studioHint:
      "Run with both tools, then strip one. The run should stop on the missing contract, not estimate the gap.",
  },
  {
    slug: "react",
    number: "03",
    title: "Loop guards",
    duration: "12 min",
    summary:
      "ReAct is the default cycle, not the default architecture. Cap the steps, and stop when the same call is about to run again.",
    concept: {
      heading: "A trace without a budget will spend one",
      paragraphs: [
        "Thought, action, observation is the unit you log and the unit you budget. ReAct is the right cycle when the next tool depends on the last observation. It is the wrong architecture when the steps are known before the first call. Those belong in state, with a router.",
        "recursion_limit is a backstop. The policy is a fingerprint of tool name plus arguments. A second identical call is a loop, not persistence. Stop it, then replan or escalate. A vaguer thought will not make the same arguments legal.",
        "Step the booking. You should be able to point at the edge that allowed calendar, the edge that allowed rooms, and the condition that would have stopped a repeat. That trace is the thing you eval. The final sentence is not.",
      ],
      takeaways: [
        "A duplicate (tool, args) pair is a stop, not another try.",
        "recursion_limit catches runaway graphs. It is not the design.",
        "Hand-build this cycle once. A harness is the same graph plus middleware.",
      ],
    },
    code: {
      title: "Stop a repeated fingerprint",
      source: `function route(state: { messages: Msg[]; calls: string[] }) {
  const fp = fingerprint(lastToolCall(state.messages))
  if (!fp) return "end"
  if (state.calls.slice(0, -1).includes(fp)) return "stop"
  return "tools"
}

invoke(graph, input, { recursion_limit: 6 })`,
    },
    demo: {
      missionId: "book-room",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      dualRun: false,
      defaultTools: {
        weather: false,
        calculator: false,
        search: false,
        calendar: true,
        rooms: true,
        notes: false,
      },
    },
    studioHint:
      "Step the booking. Name the edge that allowed each tool, and the fingerprint that would stop a repeat.",
  },
  {
    slug: "memory",
    number: "04",
    title: "Context engineering",
    duration: "12 min",
    summary:
      "A checkpointer replays a thread. A store holds a fact you chose. Retrieve by the goal, not by pasting the transcript back in.",
    concept: {
      heading: "Thread state is not a memory system",
      paragraphs: [
        "A checkpointer under a thread id is the conversation. Same id, the next turn sees prior messages. A new id is a new life. Swapping InMemorySaver for Postgres later does not create long-term memory. It only makes the thread survive the process.",
        "The scratchpad is this run: the plan, the failure class, the calls already made. It dies with the run. The store is a fact you explicitly wrote, with a key a later thread can query: “West room works for 4 at 2pm and has a whiteboard.” Tool transcripts do not belong there. Another user’s thread is not a retrieval index.",
        "Run the booking once so the note is written, then run it again. The second trace should hit the store, confirm the calendar, and reserve West. It should not rediscover East. If the recall is an essay, you stored the wrong object.",
      ],
      takeaways: [
        "Checkpointer and store are different reads.",
        "Write facts with a retrieval key. Cap the store.",
        "A fresh thread must not see another thread’s messages.",
      ],
    },
    code: {
      title: "Recall a fact, not a transcript",
      source: `const store = new Map<string, string>()

function remember(key: string, fact: string) {
  store.set(key, fact)
}

function recall(goal: string) {
  return [...store.entries()]
    .filter(([key]) => goal.includes(key))
    .map(([, fact]) => fact)
}`,
    },
    demo: {
      missionId: "book-room",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: true,
      showPlanningToggle: false,
      showFailureToggle: false,
      dualRun: true,
      defaultMemory: true,
      defaultTools: {
        weather: false,
        calculator: false,
        search: false,
        calendar: true,
        rooms: true,
        notes: true,
      },
    },
    studioHint:
      "Run once to write the fact, then again. The second trace should reserve from the store and skip the failed path.",
  },
  {
    slug: "planning",
    number: "05",
    title: "Failure policy",
    duration: "12 min",
    summary:
      "Name the failure, then pick the edge: retry a timeout, replan a conflict, escalate a denial.",
    concept: {
      heading: "Retry, replan, or stop",
      paragraphs: [
        "A plan in state is a hypothesis you can test. It is not permission for the model to invent the recovery. The next node is a function of the failure class. Transient, such as a calendar timeout: retry once, then stop. Conflict, such as East held: replan onto a room that still meets seats and whiteboard. Denied: nothing legal exists. Escalate. Do not book a worse room to make the trace look finished.",
        "Retrying a conflict spends a tool call to relearn the same fact. North fails both constraints, so it is not a creative alternative. The useful trace names the class before it names the next room.",
        "Leave the conflict on. East matches and is held. The replan edge should select West and should not contain a second reserve of East. That edge belongs in the graph, where a unit test can see it.",
      ],
      takeaways: [
        "The failure class is state. The next node is a function of it.",
        "Do not ask the model to choose the recovery edge.",
        "A denial escalates. It does not replan into a weaker constraint.",
      ],
    },
    code: {
      title: "The class picks the edge",
      source: `function nextStep(state: Job) {
  if (state.answer) return END
  if (state.failure === "transient" && state.retries < 1) return "execute"
  if (state.failure === "denied") return "escalate"
  return "replan" // conflict: do not retry East
}`,
    },
    demo: {
      missionId: "book-room",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: true,
      showFailureToggle: true,
      dualRun: false,
      defaultPlanning: true,
      defaultFailure: true,
      defaultTools: {
        weather: false,
        calculator: false,
        search: false,
        calendar: true,
        rooms: true,
        notes: false,
      },
    },
    studioHint:
      "Keep the conflict on. The trace should name the failure, skip East, and reserve West.",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

export function lessonIndex(slug: LessonSlug): number {
  return LESSONS.findIndex((lesson) => lesson.slug === slug);
}

export function adjacentLessons(slug: LessonSlug): {
  prev?: Lesson;
  next?: Lesson;
} {
  const index = lessonIndex(slug);
  return {
    prev: index > 0 ? LESSONS[index - 1] : undefined,
    next: index < LESSONS.length - 1 ? LESSONS[index + 1] : undefined,
  };
}
