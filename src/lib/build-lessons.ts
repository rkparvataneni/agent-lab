export const BUILD_SLUGS = [
  "chain-vs-graph",
  "state-graph",
  "tools",
  "react-graph",
  "create-agent",
  "memory",
  "plan-replan",
  "hitl",
  "multi-agent",
  "production",
] as const;

export type BuildSlug = (typeof BUILD_SLUGS)[number];

export type BuildLesson = {
  slug: BuildSlug;
  number: string;
  title: string;
  file: string;
  command: string;
  summary: string;
  youWill: string[];
  why: string;
};

export const BUILD_LESSONS: BuildLesson[] = [
  {
    slug: "chain-vs-graph",
    number: "01",
    title: "Evidence gate",
    file: "l01_chain_vs_graph.py",
    command: "python -m agentic_lab 01",
    summary:
      "The draft is a node. The edge you wrote refuses an answer until an observation is in state.",
    youWill: [
      "Keep a one-shot completion as a node, not the job",
      "Route on evidence with a conditional edge",
      "Prove the empty-evidence path lands on refuse",
    ],
    why: "If the model can answer without evidence, the bug is the edge, not the prompt.",
  },
  {
    slug: "state-graph",
    number: "02",
    title: "Routers and reducers",
    file: "l02_state_graph.py",
    command: "python -m agentic_lab 02",
    summary:
      "A reducer appends the trace. A pure function of state picks the desk, including an unclear ticket.",
    youWill: [
      "Append to a log with operator.add instead of overwriting it",
      "Route weather, booking, and unclear without a model",
      "Read the trace to see which edge fired",
    ],
    why: "If you cannot name the next node from state alone, that edge is still a prompt.",
  },
  {
    slug: "tools",
    number: "03",
    title: "Tool contracts",
    file: "l03_tools.py",
    command: "python -m agentic_lab 03",
    summary:
      "Schema, side effect, error class, retry rule. Policy and not_found are not retries.",
    youWill: [
      "Mark reads versus the rooms write",
      "Classify a rejected expression as policy",
      "Refuse to retry that class",
    ],
    why: "If the tool is bound, assume the model will call it. The retry rule has to be yours.",
  },
  {
    slug: "react-graph",
    number: "04",
    title: "Loop guards",
    file: "l04_react_graph.py",
    command: "python -m agentic_lab 04",
    summary:
      "Model ⇄ tools, with a step budget and a fingerprint that stops a repeated call.",
    youWill: [
      "Route on tool_calls yourself, including a stop node",
      "Invoke with recursion_limit as a backstop",
      "Watch a model that calls weather twice get stopped after one",
    ],
    why: "A harness will not invent this guard. A duplicate call is a loop, not persistence.",
  },
  {
    slug: "create-agent",
    number: "05",
    title: "Harness boundary",
    file: "l05_create_agent.py",
    command: "python -m agentic_lab 05",
    summary:
      "create_agent when the policy is model plus tools. You still assert both tools ran before the answer.",
    youWill: [
      "Build the dinner check on create_agent",
      "Assert calculator and search both returned before the final message",
      "Know which nodes do not belong in the harness",
    ],
    why: "The harness will not notice an early answer. Planner, supervisor, and approval stay as nodes you wrote.",
  },
  {
    slug: "memory",
    number: "06",
    title: "Thread vs store",
    file: "l06_memory.py",
    command: "python -m agentic_lab 06",
    summary:
      "The checkpointer is the thread. A separate store holds the forecast you chose to keep.",
    youWill: [
      "Grow one thread_id and isolate another",
      "Write the weather observation into a store keyed by the goal",
      "See that a new thread id is not a store read",
    ],
    why: "PostgresSaver makes the thread durable. It does not decide which fact is worth keeping.",
  },
  {
    slug: "plan-replan",
    number: "07",
    title: "Failure policy",
    file: "l07_plan_replan.py",
    command: "python -m agentic_lab 07",
    summary:
      "Timeout retries once. A held room replans. A denial escalates. The model does not pick the edge.",
    youWill: [
      "Store the failure class on the job",
      "Retry a transient calendar timeout a single time",
      "Replan East onto West, and refuse to book when nothing is legal",
    ],
    why: "Retrying a conflict spends a call to relearn the same fact. The class belongs in state.",
  },
  {
    slug: "hitl",
    number: "08",
    title: "Approve, then write",
    file: "l08_hitl.py",
    command: "python -m agentic_lab 08",
    summary:
      "Interrupt before the reserve. Reject must not write. A second reserve with the same key is a no-op.",
    youWill: [
      "Pause on rooms.reserve and resume with approve",
      "Resume with reject and leave the ledger empty for that room",
      "Make the write idempotent, because the node restarts from the top",
    ],
    why: "Anything before interrupt() runs again on resume. The side effect belongs after the decision.",
  },
  {
    slug: "multi-agent",
    number: "09",
    title: "Handoff contracts",
    file: "l09_multi_agent.py",
    command: "python -m agentic_lab 09",
    summary:
      "The supervisor hands off a goal and an allow-list. The specialist does not choose its toolbox.",
    youWill: [
      "Route weather vs booking in code",
      "Pass allowed tools on the ticket",
      "Fail the run if a handoff includes a tool outside the contract",
    ],
    why: "Split when permissions differ. The weather path must be unable to reserve a room.",
  },
  {
    slug: "production",
    number: "10",
    title: "Trajectory evals",
    file: "l10_production.py",
    command: "python -m agentic_lab 10",
    summary:
      "Fail the suite when the order of messages is wrong, not only when the final sentence sounds right.",
    youWill: [
      "Require human → tool call → tool result → answer",
      "Assert the loop guard, the failure classes, and the tool contract",
      "Return a Pydantic tip instead of prose you would have to regex",
    ],
    why: "A confident umbrella sentence with no weather call is a failed eval.",
  },
];

export function getBuildLesson(slug: string): BuildLesson | undefined {
  return BUILD_LESSONS.find((lesson) => lesson.slug === slug);
}

export function adjacentBuild(slug: BuildSlug): {
  prev?: BuildLesson;
  next?: BuildLesson;
} {
  const index = BUILD_LESSONS.findIndex((lesson) => lesson.slug === slug);
  return {
    prev: index > 0 ? BUILD_LESSONS[index - 1] : undefined,
    next: index < BUILD_LESSONS.length - 1 ? BUILD_LESSONS[index + 1] : undefined,
  };
}
