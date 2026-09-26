import type { MissionId, ToolName } from "./agent/types";

export const LESSON_SLUGS = [
  "loop",
  "tools",
  "react",
  "memory",
  "planning",
  "hand-code",
  "hallucination",
  "controls",
  "rate-limits",
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
  showGroundingToggle?: boolean;
  showControls?: boolean;
  showRateLimitToggle?: boolean;
  defaultTools?: Partial<Record<ToolName, boolean>>;
  defaultMemory?: boolean;
  defaultPlanning?: boolean;
  defaultFailure?: boolean;
  defaultGrounding?: boolean;
  defaultHighTemperature?: boolean;
  defaultTightTopP?: boolean;
  defaultTinyMaxTokens?: boolean;
  defaultRateLimit?: boolean;
  defaultHonorRetryAfter?: boolean;
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
  {
    slug: "hand-code",
    number: "06",
    title: "Hand-code the loop",
    duration: "15 min",
    summary:
      "Write the cycle on a blank file: messages in, a model call, your code runs tools, a tool message goes back, stop when there is no tool call.",
    concept: {
      heading: "If you cannot write the loop, you cannot debug the graph",
      paragraphs: [
        "A framework compiles this and nothing more. Start a list with the user message. Call the model. If the assistant message has no tool_calls, that content is the answer and the loop ends. If it does, your code — not the model — executes each call and appends a tool message with the same tool_call_id. Then you call the model again.",
        "The roles on a finished weather run are human, assistant, tool, assistant. The tool message is the only place an observation is allowed to appear. The model does not get to narrate a forecast it did not receive. Parallel calls are several tool messages, one id each, before the next model call. A missing id is a broken transcript, and the provider will reject the next request.",
        "Lesson 11 in the Python track is this loop with no StateGraph. After it runs, open lesson 04 and name the node that corresponds to each line. create_agent is the same loop plus middleware. The middleware will not invent a tool you forgot to dispatch.",
      ],
      takeaways: [
        "Your process executes tools. The model only proposes name and args.",
        "Every tool message carries the tool_call_id from the assistant message.",
        "Stop when tool_calls is empty, or when the step budget hits.",
      ],
    },
    code: {
      title: "The whole agent",
      source: `messages = [user(goal)]
for _ in range(8):
    ai = model.invoke(messages)
    messages.append(ai)
    if not ai.tool_calls:
        return ai.content
    for call in ai.tool_calls:
        result = tools[call.name](**call.args)
        messages.append(tool(call.id, result))
raise BudgetExceeded`,
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
      "Run it. The chatbot side is one completion. The agent side should be thought, weather, observation, answer — four beats you can write by hand.",
  },
  {
    slug: "hallucination",
    number: "07",
    title: "Hallucination",
    duration: "14 min",
    summary:
      "A fluent sentence is not evidence. Reject an answer whose numbers never appeared in a tool message, and reject a tool result the runtime did not produce.",
    concept: {
      heading: "Three different lies, three different checks",
      paragraphs: [
        "The model can answer from its parameters and never call a tool. That guess can be socially plausible and still wrong: roughly $15 instead of $14.62, a climate prior instead of Saturday's forecast. The check is mechanical. Every number in the final answer must appear in some tool message from this run. No observation list, no numeric claim.",
        "The model can also narrate an observation that never ran: “the weather tool said 70%” while the transcript has no tool message. That is a fabricated result. Only your dispatcher appends tool messages. If the assistant content quotes a tool and the transcript has no matching tool message, discard the turn.",
        "A third failure is a real tool result plus an extra claim the tool did not make. Search returned the hours, and the answer adds a phone number. The extra span is still a hallucination. Grounding is span-level, not “a tool was called somewhere.” Turn observations on and the dinner check should cite $14.62 and 22:00. Turn them off and the trace should answer without a single tool call — that answer is the bug.",
      ],
      takeaways: [
        "Numbers in the answer must be a subset of numbers in tool messages.",
        "The model does not write tool messages. Your dispatcher does.",
        "A tool call that happened does not license claims the tool did not return.",
      ],
    },
    code: {
      title: "Cite or refuse",
      source: `def grounded(answer: str, observations: list[str]) -> bool:
    if not observations:
        return False
    claimed = set(re.findall(r"\\d+(?:\\.\\d+)?", answer))
    evidence = set(re.findall(r"\\d+(?:\\.\\d+)?", " ".join(observations)))
    return claimed <= evidence`,
    },
    demo: {
      missionId: "dinner-tip",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      showGroundingToggle: true,
      dualRun: false,
      defaultGrounding: false,
    },
    studioHint:
      "Run once with observations off. The answer should contain no tool call. Turn observations on and demand $14.62 from the calculator, not “roughly $15”.",
  },
  {
    slug: "controls",
    number: "08",
    title: "Sampling controls",
    duration: "16 min",
    summary:
      "temperature, top_p, top_k, and max_tokens change which token is drawn. A TPU does not. TPM is a budget, not a sampler.",
    concept: {
      heading: "The knobs on the model call, named correctly",
      paragraphs: [
        "temperature stretches or sharpens the distribution. Near 0 the mode wins, which for a tool-using agent should be the tool-call token. Near 1 the tail is in play and the model can skip the tool and write a guess. top_p (nucleus) keeps the smallest set of tokens whose probabilities sum to p. A tight top_p collapses that set back onto the mode even when temperature is high. top_k keeps only the k most likely tokens. top_k = 1 is greedy. These three interact. Set them on purpose, and log them on the trace.",
        "max_tokens is not a style control. It is a hard stop. If the cap hits while the tool-call JSON is still open, finish_reason is length, the arguments are garbage, and you must not execute them. frequency_penalty and presence_penalty push the model off tokens it already used. seed plus temperature 0 is how you reproduce a trace. stop is a string list that ends the completion. n is how many completions you asked for. None of these repair a missing tool.",
        "A TPU is a chip some providers train and serve models on. You do not pass tpu= to the agent loop. TPM, tokens per minute, is a rate-limit budget on the account. top_p is the sampler. People mix the three up because the names are short. Flip high temperature and the studio skips the tool. Flip tight top-p as well and the tool call comes back. Flip tiny max tokens and the run stops on length before any tool runs.",
      ],
      takeaways: [
        "temperature, top_p, and top_k choose the token. Log the values you sent.",
        "max_tokens can truncate a tool call. A partial call is not executed.",
        "A TPU is hardware. top_p is a sampler. TPM is a rate-limit budget.",
      ],
    },
    code: {
      title: "What you actually send",
      source: `model.invoke(messages, temperature=0, top_p=1, max_tokens=256, seed=7)

# temperature high + top_p open  → may skip the tool
# top_p <= 0.2 or top_k == 1     → mode, usually the tool token
# max_tokens too small           → finish_reason "length", do not exec
# TPU                            → not a parameter
# TPM                            → tokens per minute, a budget, see rate limits`,
    },
    demo: {
      missionId: "tokyo-weekend",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      showControls: true,
      dualRun: false,
      defaultHighTemperature: false,
      defaultTightTopP: false,
      defaultTinyMaxTokens: false,
    },
    studioHint:
      "Run the default first and watch weather fire. Then high temperature alone, then high temperature plus tight top-p, then tiny max tokens.",
  },
  {
    slug: "rate-limits",
    number: "09",
    title: "Rate limits",
    duration: "14 min",
    summary:
      "429 means the account budget is empty. Honor Retry-After. Do not retry a policy error. RPM and TPM are different caps.",
    concept: {
      heading: "Backoff is a policy, not a while-true",
      paragraphs: [
        "Providers cap you two ways. RPM is requests per minute. TPM is tokens per minute. A short request can pass RPM and still fail TPM if the prompt is huge. The honest signal is HTTP 429 with a Retry-After header, sometimes plus a body that names which budget you hit. Sleep that long, then send the same request once. Immediate retries sit inside the same window and turn one 429 into a burst that empties RPM for everyone else on the key.",
        "Not every failure is a 429. A policy rejection — illegal calculator input, a tool that is not allowed — will fail the same way on the next try. Retrying it spends budget to relearn a fact you already have. Timeouts and 429s are the retryable classes, and both need a cap: one sleep, one retry, then surface the error. Jitter matters when many workers share a key, or they wake up together and stampede.",
        "Leave Retry-After honored and the trace should show the 429, the sleep, then the weather call and an answer. Turn the honor switch off and the trace should stop on the second 429 with no forecast. That second call did not make the model smarter.",
      ],
      takeaways: [
        "429 plus Retry-After: sleep, retry once, then stop.",
        "RPM and TPM are separate. A small request can still blow TPM.",
        "Policy errors are not rate limits. Do not back off into them.",
      ],
    },
    code: {
      title: "One sleep, one retry",
      source: `if response.status == 429 and attempt == 0 and honor:
    time.sleep(float(response.headers["retry-after"]))
    return send(request)          # same request, not a new plan
if response.status == 429:
    raise BudgetExhausted
if response.error_class == "policy":
    raise PolicyError              # do not loop`,
    },
    demo: {
      missionId: "tokyo-weekend",
      compareChatbot: false,
      allowToolToggle: false,
      showMemoryToggle: false,
      showPlanningToggle: false,
      showFailureToggle: false,
      showRateLimitToggle: true,
      dualRun: false,
      defaultRateLimit: true,
      defaultHonorRetryAfter: true,
    },
    studioHint:
      "Run with Retry-After honored. You should see 429, a sleep, then the forecast. Turn honor off and the run should die on the second 429.",
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
