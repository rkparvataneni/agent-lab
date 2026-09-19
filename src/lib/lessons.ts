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
    title: "The agent loop",
    duration: "8 min",
    summary:
      "A chatbot predicts the next sentence. An agent is a loop that can act, see the result, and decide again.",
    concept: {
      heading: "The difference is architecture, not vibes",
      paragraphs: [
        "Most people meet language models as chat boxes. That interface hides the real design choice. A chatbot is a single completion: prompt in, text out. An agent is a program that keeps calling the model until a goal is done.",
        "Each turn the model must choose: answer now, or take an action. If it acts, your code runs a tool and feeds the observation back in. That perceive → reason → act → observe cycle is the whole game. Fancy planners, multi-agent graphs, and memory layers are variations on this loop.",
        "Watch the same question hit both systems. The chatbot hedges because it cannot see the weekend forecast. The agent refuses to guess, calls weather, and then answers with the observation in hand.",
      ],
      takeaways: [
        "An agent is a loop around a model, not a smarter model.",
        "The model proposes actions. Your code executes them.",
        "Stopping without a tool is a valid, honest outcome.",
      ],
    },
    code: {
      title: "The loop you will keep rewriting",
      source: `async function runAgent(goal: string, tools: Tool[]) {
  const observations: string[] = []

  for (let step = 0; step < 8; step++) {
    const move = await llm.choose({ goal, tools, observations })
    if (move.kind === "answer") return move.text

    const result = await tools.call(move.tool, move.args)
    observations.push(\`\${move.tool}: \${result}\`)
  }

  throw new Error("Stopped before the agent answered")
}`,
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
      "Ask both systems the same packing question. The chatbot guesses. The agent looks it up.",
  },
  {
    slug: "tools",
    number: "02",
    title: "Tools are the hands",
    duration: "10 min",
    summary:
      "The model cannot fetch weather or do reliable math. You attach typed functions and let it fill in the arguments.",
    concept: {
      heading: "Schemas, not magic plugins",
      paragraphs: [
        "A tool is an ordinary function plus a JSON schema the model can read. The schema names the function, explains when to use it, and lists arguments. The model never runs the function. It emits a call. Your runtime validates the arguments and executes the code.",
        "That split is the safety boundary. The model can ask to search. It cannot browse the open internet unless you wrote a search tool and decided what it returns. Keep tools small, deterministic when you can, and loud when they fail.",
        "This lesson uses two tools on purpose. Tip math needs a calculator. Restaurant hours need search. Turn one off and the agent should stall instead of inventing the missing fact.",
      ],
      takeaways: [
        "A tool is a schema + an execute function you control.",
        "Missing tools should block the run, not invite hallucination.",
        "Give each tool one job. Compose them in the loop.",
      ],
    },
    code: {
      title: "A tool the model can request",
      source: `const calculator = {
  name: "calculator",
  description: "Evaluate a simple arithmetic expression.",
  parameters: {
    type: "object",
    properties: {
      expression: { type: "string" },
    },
    required: ["expression"],
  },
  execute: async ({ expression }) => String(Function(\`return (\${expression})\`)()),
}`,
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
      "Run with both tools, then strip calculator or search. A good agent stops when a hand is missing.",
  },
  {
    slug: "react",
    number: "03",
    title: "ReAct: think, act, look",
    duration: "10 min",
    summary:
      "ReAct is the default production pattern: a thought, a tool call, an observation, then another thought.",
    concept: {
      heading: "Interleave reasoning with evidence",
      paragraphs: [
        "ReAct (Yao et al., 2022) is a prompting and tracing pattern: the model writes a short thought, names an action, then waits for an observation. It does not dump a finished essay and hope the facts were right.",
        "The thought is not decoration. It is working memory for the next decision: why this tool, what would change my mind, what I still lack. When you debug an agent, you debug this trace. If thoughts are vague, tool calls get sloppy. If thoughts repeat, you are looping.",
        "Step through a room booking. Notice the rhythm: thought → calendar → observation → thought → rooms → observation → answer. That rhythm is what you log, evaluate, and later put behind a debugger.",
      ],
      takeaways: [
        "Thought, action, observation is the unit of work.",
        "Traces are how you debug agents — treat them as product UI.",
        "Cap the number of cycles. Infinite loops are a real failure mode.",
      ],
    },
    code: {
      title: "Force the model to speak ReAct",
      source: `const system = \`
You are an agent. On every turn output exactly one of:
- THOUGHT: why the next action helps the goal
- ACTION: tool_name \\n ARGS: { ... }
- ANSWER: the final reply to the user

Never invent an observation. Wait for the runtime.
\``,
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
      "Use Step to walk the booking one card at a time. Read every thought before the next tool fires.",
  },
  {
    slug: "memory",
    number: "04",
    title: "Memory that earns its keep",
    duration: "9 min",
    summary:
      "Without memory every run starts over. With too much memory the model drowns. Store only facts you will reuse.",
    concept: {
      heading: "Three memories, three jobs",
      paragraphs: [
        "Conversation history is the chat log. It tells the model what the user already said. It is the wrong place for tool transcripts that will never be needed again.",
        "The scratchpad is this-run working memory: thoughts, partial results, the current plan. It dies when the run ends. Long-term notes are curated facts you choose to keep: 'West room has a whiteboard', 'Katsu House closes at 22:00'. Those notes are retrieved on the next mission.",
        "Run the booking twice. The first pass pays for calendar and rooms. The second pass, with memory on, recalls the useful room and skips the dead end. That is the economic argument for memory: spend tokens on new evidence, not on relearning the building.",
      ],
      takeaways: [
        "History, scratchpad, and long-term notes are different stores.",
        "Write notes as facts, not essays.",
        "Retrieve only what the current goal can use.",
      ],
    },
    code: {
      title: "Keep notes tiny and factual",
      source: `type Memory = {
  history: { role: "user" | "assistant"; content: string }[]
  scratchpad: string[]
  notes: string[]
}

function remember(notes: string[], fact: string) {
  if (notes.includes(fact)) return notes
  return [...notes, fact].slice(-20)
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
      "Run once to write a note, then run again. The second trace should recall West/East instead of rediscovering it.",
  },
  {
    slug: "planning",
    number: "05",
    title: "Plan, then recover",
    duration: "10 min",
    summary:
      "Write the steps before you spend tool calls. When the world says no, replan — do not hammer the same door.",
    concept: {
      heading: "A plan is a cheap hypothesis",
      paragraphs: [
        "For any goal with more than one tool call, ask the model for a short plan first. The plan is not a contract with the universe. It is a hypothesis you can audit: did we forget a constraint? Are we about to do work we cannot use?",
        "The useful skill is recovery. Tools fail. Rooms get taken. APIs 429. A brittle agent retries the same call. A durable one observes the failure, revises the plan, and picks a different action. That is still the same loop — the thought just got more honest.",
        "Turn on a booking conflict. East is the obvious room and it is held. The agent should refuse North (too small, no board) and take West. That decision is the whole lesson.",
      ],
      takeaways: [
        "Plan first when the job has more than one dependency.",
        "Treat a failed tool as new evidence, not an embarrassment.",
        "Replanning is cheaper than an infinite retry.",
      ],
    },
    code: {
      title: "Separate planning from acting",
      source: `const plan = await llm.plan(goal, tools)

for (const step of plan.steps) {
  const result = await tools.call(step.tool, step.args)
  if (result.ok) continue

  const next = await llm.replan({ goal, plan, failed: step, result })
  return runPlan(next)
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
      "Keep the conflict toggle on. Watch the plan, the failed East room, then the replan onto West.",
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
