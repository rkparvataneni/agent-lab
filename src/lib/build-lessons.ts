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
    title: "Chain vs graph",
    file: "l01_chain_vs_graph.py",
    command: "python -m agentic_lab 01",
    summary:
      "A chain is one completion. A graph is a program that can refuse a guess and demand a tool.",
    youWill: [
      "See why LCEL / invoke-once is not an agent",
      "Compile a two-node StateGraph",
      "Keep the chain as a node inside the graph",
    ],
    why: "LangChain composes model calls. LangGraph owns the job when control flow branches.",
  },
  {
    slug: "state-graph",
    number: "02",
    title: "StateGraph",
    file: "l02_state_graph.py",
    command: "python -m agentic_lab 02",
    summary:
      "State in, a node updates a slice, a conditional edge picks the next desk.",
    youWill: [
      "Declare state as a TypedDict",
      "Add nodes and START/END edges",
      "Route with add_conditional_edges",
    ],
    why: "Every later pattern is this: typed state plus a router you can test without an LLM.",
  },
  {
    slug: "tools",
    number: "03",
    title: "Tools",
    file: "l03_tools.py",
    command: "python -m agentic_lab 03",
    summary:
      "@tool turns a function into a schema. You execute it. The model only fills args.",
    youWill: [
      "Read the JSON schema LangChain generates",
      "Invoke weather, calculator, and search",
      "See the calculator reject a code-injection expression",
    ],
    why: "The safety boundary is here. If a tool exists, assume the model will call it.",
  },
  {
    slug: "react-graph",
    number: "04",
    title: "Hand-built ReAct graph",
    file: "l04_react_graph.py",
    command: "python -m agentic_lab 04",
    summary:
      "The loop you must be able to draw: model ⇄ ToolNode until there are no tool_calls.",
    youWill: [
      "Wire MessagesState, ToolNode, and tools_condition",
      "Bind tools on a chat model",
      "Watch Human → AI (call) → Tool → AI (answer)",
    ],
    why: "create_agent is this graph plus middleware. If you cannot build this, you cannot debug that.",
  },
  {
    slug: "create-agent",
    number: "05",
    title: "create_agent harness",
    file: "l05_create_agent.py",
    command: "python -m agentic_lab 05",
    summary:
      "LangChain 1.x ships the ReAct graph as create_agent. Use it when the job is model + tools + policy.",
    youWill: [
      "Construct create_agent with a system prompt",
      "Pass a model instance (scripted now, OpenAI later)",
      "Finish the dinner-tip mission with two tools",
    ],
    why: "Reach for the harness first. Drop to StateGraph when a node must be deterministic.",
  },
  {
    slug: "memory",
    number: "06",
    title: "Checkpoints and memory",
    file: "l06_memory.py",
    command: "python -m agentic_lab 06",
    summary:
      "InMemorySaver + thread_id is short-term memory. A new thread is a new life.",
    youWill: [
      "Pass checkpointer into create_agent",
      "Replay on the same thread_id",
      "Prove a fresh thread does not see the first trip",
    ],
    why: "Production swaps InMemorySaver for PostgresSaver. The invoke API does not change.",
  },
  {
    slug: "plan-replan",
    number: "07",
    title: "Plan, execute, replan",
    file: "l07_plan_replan.py",
    command: "python -m agentic_lab 07",
    summary:
      "Write the plan as state. Execute. On conflict, revise the plan — do not hammer East.",
    youWill: [
      "Keep a plan list on the graph state",
      "Branch with a conditional edge after execute",
      "Book West only after East is held",
    ],
    why: "This is how you keep multi-step work cheap: the model does not own the control flow.",
  },
  {
    slug: "hitl",
    number: "08",
    title: "Human-in-the-loop",
    file: "l08_hitl.py",
    command: "python -m agentic_lab 08",
    summary:
      "interrupt() pauses. Command(resume=...) continues the same thread after a human decides.",
    youWill: [
      "Pause before rooms.reserve",
      "Resume with approve",
      "See why the node restarts from the top",
    ],
    why: "Any irreversible tool — pay, email, book — sits behind an interrupt in production.",
  },
  {
    slug: "multi-agent",
    number: "09",
    title: "Multi-agent supervisor",
    file: "l09_multi_agent.py",
    command: "python -m agentic_lab 09",
    summary:
      "A specialist is a compiled graph. A supervisor is a router. Split toolboxes, not egos.",
    youWill: [
      "Route weather vs booking without an LLM vote",
      "Call lesson 04 and 07 as subgraphs",
      "Keep rooms.reserve off the weather path",
    ],
    why: "Multi-agent is permission design. The weather model must not be able to book a room.",
  },
  {
    slug: "production",
    number: "10",
    title: "Production patterns",
    file: "l10_production.py",
    command: "python -m agentic_lab 10",
    summary:
      "Structured output, evals in CI, real checkpointers, tracing, least-privilege tools.",
    youWill: [
      "Return a Pydantic TipCheck instead of prose",
      "Run a fixture suite over earlier graphs",
      "Leave with a ship checklist",
    ],
    why: "If you cannot fail a unit test when weather is missing, you do not have an agent. You have a demo.",
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
