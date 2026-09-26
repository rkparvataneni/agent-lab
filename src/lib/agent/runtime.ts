import { getMission } from "./missions";
import type {
  AgentRun,
  AgentStep,
  MissionId,
  RunConfig,
  ToolFlags,
  ToolName,
} from "./types";

type StepDraft = Omit<AgentStep, "id">;

function missingRequired(config: RunConfig, required: ToolName[]): ToolName[] {
  return required.filter((tool) => !config.tools[tool]);
}

function relevantNotes(missionId: MissionId, notes: string[]): string[] {
  const needles: Record<MissionId, string[]> = {
    "tokyo-weekend": ["tokyo", "umbrella", "saturday"],
    "dinner-tip": ["katsu", "tip", "14.62"],
    "book-room": ["west room", "whiteboard", "2pm"],
  };

  return notes.filter((note) =>
    needles[missionId].some((needle) => note.toLowerCase().includes(needle)),
  );
}

function buildTokyo(config: RunConfig, recalled: string[]): StepDraft[] {
  const steps: StepDraft[] = [];

  if (config.planning) {
    steps.push({
      kind: "plan",
      title: "Plan",
      body: "1. Weather is a required observation. Do not answer from climate priors.\n2. Open the answer edge only after the forecast is in state.",
    });
  }

  if (recalled.length > 0) {
    steps.push({
      kind: "memory",
      title: "Recall",
      body: recalled[0],
    });
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "Store hit for this goal. The forecast is already evidence. Do not spend another weather call.",
    });
    steps.push({
      kind: "answer",
      title: "Answer",
      body: "Yes — Saturday still looks like showers. Pack the umbrella. Sunday should clear up.",
    });
    return steps;
  }

  steps.push({
    kind: "thought",
    title: "Thought",
      body: "No forecast in state. The answer edge stays closed until weather returns an observation.",
  });
  steps.push({
    kind: "action",
    title: "Action · weather",
    body: "Ask for Tokyo's Saturday–Sunday forecast.",
    tool: "weather",
    args: { city: "Tokyo", when: "weekend" },
  });
  steps.push({
    kind: "observation",
    title: "Observation",
    body: "Saturday: showers, 18°C, 70% chance of rain. Sunday: clearing, 21°C, 10% chance of rain.",
    tool: "weather",
  });
  steps.push({
    kind: "thought",
    title: "Thought",
      body: "Saturday is 70% rain. That observation is enough to open the answer edge. Sunday does not cancel it.",
  });
  steps.push({
    kind: "answer",
    title: "Answer",
    body: "Yes. Saturday in Tokyo looks like showers (about 70% chance). Pack an umbrella. Sunday should be clearer and around 21°C.",
  });
  return steps;
}

function buildDinner(config: RunConfig, recalled: string[]): StepDraft[] {
  const steps: StepDraft[] = [];
  const hasCalc = config.tools.calculator;
  const hasSearch = config.tools.search;

  if (config.planning) {
    steps.push({
      kind: "plan",
      title: "Plan",
      body: "1. Tip is a calculator result, not an estimate.\n2. Hours are a search result.\n3. Answer only after both contracts return ok.",
    });
  }

  if (recalled.length > 0 && hasCalc && hasSearch) {
    steps.push({
      kind: "memory",
      title: "Recall",
      body: recalled[0],
    });
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "Store already has the tip. Hours can go stale, so re-read search. Do not recompute 86 * 0.17.",
    });
    steps.push({
      kind: "action",
      title: "Action · search",
      body: "Recheck Katsu House hours.",
      tool: "search",
      args: { query: "Katsu House hours today" },
    });
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "Katsu House · open 11:30–22:00. Local time 20:10.",
      tool: "search",
    });
    steps.push({
      kind: "answer",
      title: "Answer",
      body: "Tip is $14.62. Katsu House is still open — last seating is 22:00, and it is 20:10 now.",
    });
    return steps;
  }

  if (hasCalc) {
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "Arithmetic is a tool contract. Call the calculator, then search. Do not estimate either number.",
    });
    steps.push({
      kind: "action",
      title: "Action · calculator",
      body: "Evaluate 86 * 0.17",
      tool: "calculator",
      args: { expression: "86 * 0.17" },
    });
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "14.62",
      tool: "calculator",
    });
  }

  if (hasSearch) {
    if (!hasCalc) {
      steps.push({
        kind: "thought",
        title: "Thought",
        body: "Search can return hours. The tip still has no calculator result, so the answer edge stays closed.",
      });
    }
    steps.push({
      kind: "action",
      title: "Action · search",
      body: "Look up Katsu House opening hours.",
      tool: "search",
      args: { query: "Katsu House hours today" },
    });
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "Katsu House · open 11:30–22:00. Local time 20:10.",
      tool: "search",
    });
  }

  if (hasCalc && hasSearch) {
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "Both tools returned ok. The answer can cite $14.62 and 22:00. Nothing else is still required.",
    });
    steps.push({
      kind: "answer",
      title: "Answer",
      body: "A 17% tip on $86 is $14.62. Katsu House is open until 22:00 and it is 20:10 now, so you still have time.",
    });
    return steps;
  }

  if (hasCalc) {
    steps.push({
      kind: "error",
      title: "Blocked",
      body: "Calculator returned $14.62. Search is not bound, so hours are not_found, not a guess. Stop.",
    });
    return steps;
  }

  steps.push({
    kind: "error",
    title: "Blocked",
      body: "Search returned hours. The tip has no calculator result. Policy: do not estimate. Stop.",
  });
  return steps;
}

function buildRoom(config: RunConfig, recalled: string[]): StepDraft[] {
  const steps: StepDraft[] = [];

  if (config.planning) {
    steps.push({
      kind: "plan",
      title: "Plan",
      body: "1. Confirm 14:00 on the calendar.\n2. List rooms that seat 4 and have a whiteboard.\n3. Reserve the first legal match. A conflict replans. A denial escalates.",
    });
  }

  if (recalled.length > 0 && !config.injectFailure) {
    steps.push({
      kind: "memory",
      title: "Recall",
      body: recalled[0],
    });
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "Store hit: West meets seats and whiteboard. Confirm the calendar, then reserve West. Do not rediscover East.",
    });
    steps.push({
      kind: "action",
      title: "Action · calendar",
      body: "Check tomorrow at 14:00.",
      tool: "calendar",
      args: { when: "tomorrow 14:00" },
    });
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "Free. No conflicts between 13:30 and 15:30.",
      tool: "calendar",
    });
    steps.push({
      kind: "action",
      title: "Action · rooms",
      body: "Reserve West room for 4 people at 14:00.",
      tool: "rooms",
      args: { room: "west", seats: 4, when: "tomorrow 14:00" },
    });
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "Reserved · West room · capacity 8 · whiteboard · 14:00–15:00.",
      tool: "rooms",
    });
    steps.push({
      kind: "answer",
      title: "Answer",
      body: "Booked. West room tomorrow at 2pm, seats 8, whiteboard on the east wall. Calendar is clear.",
    });
    return steps;
  }

  steps.push({
    kind: "thought",
    title: "Thought",
      body: "Reserve is a write. Read the calendar and the room list first. Do not hold a room that fails a constraint.",
  });
  steps.push({
    kind: "action",
    title: "Action · calendar",
    body: "Check tomorrow at 14:00.",
    tool: "calendar",
    args: { when: "tomorrow 14:00" },
  });
  steps.push({
    kind: "observation",
    title: "Observation",
    body: "Free. No conflicts between 13:30 and 15:30.",
    tool: "calendar",
  });
  steps.push({
    kind: "action",
    title: "Action · rooms",
    body: "List rooms for 4 people with a whiteboard at 14:00.",
    tool: "rooms",
    args: { seats: 4, whiteboard: true, when: "tomorrow 14:00" },
  });

  if (config.injectFailure) {
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "East room matches but is already held 13:00–15:00. North room is free but only seats 2 and has no whiteboard. West room is free, seats 8, whiteboard.",
      tool: "rooms",
    });
    steps.push({
      kind: "replan",
      title: "Replan",
      body: "Failure class: conflict. East matches and is held. North fails seats and whiteboard. Do not retry East. Replan to West.",
    });
  } else {
    steps.push({
      kind: "observation",
      title: "Observation",
      body: "East room · seats 6 · whiteboard · free at 14:00.\nWest room · seats 8 · whiteboard · free at 14:00.",
      tool: "rooms",
    });
    steps.push({
      kind: "thought",
      title: "Thought",
      body: "East meets seats and whiteboard and it is free. Reserve it. West stays unused.",
    });
  }

  const room = config.injectFailure ? "west" : "east";
  steps.push({
    kind: "action",
    title: `Action · rooms`,
    body: `Reserve ${room === "west" ? "West" : "East"} room for 4 people at 14:00.`,
    tool: "rooms",
    args: { room, seats: 4, when: "tomorrow 14:00" },
  });
  steps.push({
    kind: "observation",
    title: "Observation",
    body:
      room === "west"
        ? "Reserved · West room · capacity 8 · whiteboard · 14:00–15:00."
        : "Reserved · East room · capacity 6 · whiteboard · 14:00–15:00.",
    tool: "rooms",
  });
  steps.push({
    kind: "answer",
    title: "Answer",
    body:
      room === "west"
        ? "Booked after a conflict: West room tomorrow at 2pm, seats 8, whiteboard included. Your calendar is clear."
        : "Booked. East room tomorrow at 2pm, seats 6, whiteboard included. Your calendar is clear.",
  });
  return steps;
}

function noteFor(missionId: MissionId, steps: StepDraft[]): string | null {
  const answered = steps.some((step) => step.kind === "answer");
  if (!answered) return null;

  switch (missionId) {
    case "tokyo-weekend":
      return "Tokyo weekend: Saturday showers (~70%), Sunday clear. Umbrella recommended.";
    case "dinner-tip":
      return "Katsu House open until 22:00. 17% of $86 = $14.62.";
    case "book-room": {
      const reservedWest = steps.some(
        (step) =>
          step.kind === "observation" &&
          step.body.toLowerCase().includes("west room"),
      );
      return reservedWest
        ? "West room works for 4 people at 2pm and has a whiteboard."
        : "East room works for 4 people at 2pm and has a whiteboard.";
    }
  }
}

function ungroundedAnswer(missionId: MissionId): string {
  switch (missionId) {
    case "tokyo-weekend":
      return "Tokyo weekends are often rainy, so pack an umbrella. That is a climate prior, not a forecast.";
    case "dinner-tip":
      return "17% of $86 is roughly $15. Katsu House is probably still open.";
    case "book-room":
      return "Book the East room. The calendar and the whiteboard were not checked.";
  }
}

function sampledGuess(missionId: MissionId, why: string): StepDraft[] {
  return [
    {
      kind: "thought",
      title: "No tool call",
      body: why,
    },
    {
      kind: "answer",
      title: "Ungrounded answer",
      body: ungroundedAnswer(missionId),
    },
  ];
}

function truncatedCall(): StepDraft[] {
  return [
    {
      kind: "error",
      title: "stop_reason = length",
      body: "max_tokens cut the tool-call JSON before the object closed. Do not execute a partial call. This is not a policy error and not a 429. Raise max_tokens, or shorten the prompt.",
    },
  ];
}

function rateLimitExhausted(): StepDraft[] {
  return [
    {
      kind: "action",
      title: "Model call",
      body: "POST /chat/completions · about 800 tokens",
    },
    {
      kind: "error",
      title: "429 rate_limit",
      body: "TPM remaining 0 of 30000. Retry-After: 2. RPM and TPM are separate caps. A 429 is retryable. A policy rejection is not.",
    },
    {
      kind: "action",
      title: "Immediate retry",
      body: "Retry-After was ignored. The same request went out inside the window.",
    },
    {
      kind: "error",
      title: "Budget exhausted",
      body: "Second 429. Stop. Honor the header, then retry once. Hammering the endpoint spends RPM and does not change the answer.",
    },
  ];
}

const RATE_LIMIT_BACKOFF: StepDraft[] = [
  {
    kind: "error",
    title: "429 rate_limit",
    body: "TPM remaining 0 of 30000. Retry-After: 2. The request itself is fine.",
  },
  {
    kind: "thought",
    title: "Backoff",
    body: "Slept 2s from Retry-After, then sent the same request once. A policy error would have stopped here instead.",
  },
];

export function runAgent(
  missionId: MissionId,
  config: RunConfig,
  priorNotes: string[] = [],
): AgentRun {
  const mission = getMission(missionId);
  const recalled = config.memory ? relevantNotes(missionId, priorNotes) : [];
  const missing = missingRequired(config, mission.required);

  const drafts: StepDraft[] = [];
  const hotSample = config.temperature >= 0.8 && config.topP > 0.3;

  if (config.maxTokens < 24) {
    drafts.push(...truncatedCall());
  } else if (!config.grounding) {
    drafts.push(
      ...sampledGuess(
        missionId,
        "Grounding is off. A fluent answer is allowed with an empty observation list. Nothing in that sentence was returned by a tool.",
      ),
    );
  } else if (hotSample) {
    drafts.push(
      ...sampledGuess(
        missionId,
        `temperature ${config.temperature} spread the distribution and top_p ${config.topP} left the tail in play, so the sample skipped the tool token. Tighten top_p or drop temperature to land on the mode.`,
      ),
    );
  } else if (config.injectRateLimit && !config.honorRetryAfter) {
    drafts.push(...rateLimitExhausted());
  } else if (config.leakSecret) {
    drafts.push({
      kind: "error",
      title: "Credential leak",
      body: "The user token was pasted into the prompt. Refuse the model call. The runtime attaches a rooms.reserve scope on the tool. The model cannot widen that scope, and the token is not a message.",
    });
  } else if (config.overBudget) {
    drafts.push(
      {
        kind: "thought",
        title: "Route",
        body: "Classification used the small model, 12 tokens. The answer model would spend 800.",
      },
      {
        kind: "error",
        title: "Over budget",
        body: "40 tokens remain. The answer call does not fit. Stop. Do not send it and hope the provider truncates something useful.",
      },
    );
  } else if (config.vagueGoal && missionId === "book-room") {
    drafts.push(
      {
        kind: "thought",
        title: "Missing slots",
        body: "party_size, when, and whiteboard are unset. Inventing 2pm, 4 people, or East is the bug interviewers are listening for.",
      },
      {
        kind: "answer",
        title: "One question",
        body: "What time, how many people, and do you need a whiteboard? I will not book until you say.",
      },
    );
  } else if (config.partialFailure && missionId === "dinner-tip") {
    drafts.push(
      {
        kind: "thought",
        title: "Fan-out",
        body: "Calculator and search do not depend on each other. Call both. A failure of one does not discard the other.",
      },
      {
        kind: "action",
        title: "Action · calculator",
        body: "Evaluate 86 * 0.17",
        tool: "calculator",
        args: { expression: "86 * 0.17" },
      },
      {
        kind: "observation",
        title: "Observation",
        body: "14.62",
        tool: "calculator",
      },
      {
        kind: "action",
        title: "Action · search",
        body: "Look up Katsu House hours.",
        tool: "search",
        args: { query: "Katsu House hours today" },
      },
      {
        kind: "error",
        title: "search failed",
        body: "HTTP 500 from search. Keep 14.62. Do not recompute 86 * 0.17.",
      },
      {
        kind: "action",
        title: "Retry · search",
        body: "Same query, once.",
        tool: "search",
        args: { query: "Katsu House hours today" },
      },
      {
        kind: "observation",
        title: "Observation",
        body: "Katsu House · open 11:30–22:00. Local time 20:10.",
        tool: "search",
      },
      {
        kind: "answer",
        title: "Answer",
        body: "A 17% tip on $86 is $14.62. Katsu House is open until 22:00 and it is 20:10 now.",
      },
    );
  } else if (missing.length > 0 && recalled.length === 0) {
    if (config.planning) {
      drafts.push({
        kind: "plan",
        title: "Plan",
        body: `I would ${mission.required.join(" → ")}, then answer. Checking which tools are actually attached…`,
      });
    }
    drafts.push({
      kind: "thought",
      title: "Thought",
      body: `Required tools are not all bound: ${mission.required.join(" and ")}. The answer edge stays closed.`,
    });
    drafts.push({
      kind: "error",
      title: "Blocked",
      body: `Contract broken. Missing tool${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Stop. Do not fill the gap from memory of the world.`,
    });
  } else if (missionId === "tokyo-weekend") {
    drafts.push(...buildTokyo(config, recalled));
  } else if (missionId === "dinner-tip") {
    drafts.push(...buildDinner(config, recalled));
  } else {
    drafts.push(...buildRoom(config, recalled));
  }

  if (
    config.injectRateLimit &&
    config.honorRetryAfter &&
    config.maxTokens >= 24 &&
    config.grounding &&
    !hotSample &&
    !config.leakSecret &&
    !config.overBudget &&
    !(config.vagueGoal && missionId === "book-room") &&
    !(config.partialFailure && missionId === "dinner-tip")
  ) {
    drafts.unshift(...RATE_LIMIT_BACKOFF);
  }

  const steps: AgentStep[] = drafts.map((step, index) => ({
    ...step,
    id: `${missionId}-${index + 1}`,
  }));

  const answerStep = steps.find((step) => step.kind === "answer");
  const blocked = steps.some((step) => step.kind === "error");
  const note = config.memory ? noteFor(missionId, drafts) : null;
  const notes = note ? [note] : [];

  if (note && answerStep) {
    steps.push({
      id: `${missionId}-note`,
      kind: "memory",
      title: "Write note",
      body: note,
      tool: "notes",
    });
  }

  const toolsUsed = [
    ...new Set(
      steps
        .filter((step) => step.kind === "action" && step.tool)
        .map((step) => step.tool as ToolName),
    ),
  ];

  return {
    missionId,
    goal: mission.goal,
    steps,
    answer: answerStep?.body ?? null,
    notes,
    status: answerStep ? "answered" : blocked ? "blocked" : "failed",
    toolsUsed,
  };
}

export function defaultConfig(
  overrides: Partial<Omit<RunConfig, "tools">> & {
    tools?: Partial<ToolFlags>;
  } = {},
): RunConfig {
  return {
    memory: overrides.memory ?? false,
    planning: overrides.planning ?? false,
    injectFailure: overrides.injectFailure ?? false,
    grounding: overrides.grounding ?? true,
    temperature: overrides.temperature ?? 0,
    topP: overrides.topP ?? 1,
    maxTokens: overrides.maxTokens ?? 256,
    injectRateLimit: overrides.injectRateLimit ?? false,
    honorRetryAfter: overrides.honorRetryAfter ?? true,
    vagueGoal: overrides.vagueGoal ?? false,
    partialFailure: overrides.partialFailure ?? false,
    overBudget: overrides.overBudget ?? false,
    leakSecret: overrides.leakSecret ?? false,
    tools: {
      weather: true,
      calculator: true,
      search: true,
      calendar: true,
      rooms: true,
      notes: true,
      ...overrides.tools,
    },
  };
}
