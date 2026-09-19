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
      body: "1. Fetch the Tokyo weekend forecast.\n2. Decide whether Saturday rain is likely enough to pack an umbrella.",
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
      body: "I already logged this forecast. No need to call weather again.",
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
    body: "A packing decision depends on the actual weekend forecast, not a climate average. I should look it up.",
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
    body: "Saturday rain is likely. An umbrella is worth the suitcase space even if Sunday is dry.",
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
      body: "1. Compute 17% of $86 with the calculator.\n2. Look up Katsu House hours.\n3. Answer both parts together.",
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
      body: "I already computed the tip and checked hours. I'll confirm the restaurant is still in the same window.",
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
      body: "17% of 86 is easy to get wrong in my head. I'll compute it, then check hours.",
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
        body: "I can look up hours, but I should not guess 17% of 86.",
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
      body: "Both facts are in. I can answer the whole question.",
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
      body: "Tip is $14.62, but hours are unknown. Attach the search tool to finish the second half.",
    });
    return steps;
  }

  steps.push({
    kind: "error",
    title: "Blocked",
    body: "Katsu House is open until 22:00, but I will not guess 17% of $86. Attach the calculator.",
  });
  return steps;
}

function buildRoom(config: RunConfig, recalled: string[]): StepDraft[] {
  const steps: StepDraft[] = [];

  if (config.planning) {
    steps.push({
      kind: "plan",
      title: "Plan",
      body: "1. Confirm you are free tomorrow at 14:00.\n2. List rooms that seat 4 and have a whiteboard.\n3. Reserve the first match.",
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
      body: "Last run already found that the West room works. I'll confirm the calendar, then book West directly.",
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
    body: "Before I hold a room I should confirm the calendar slot, then filter rooms by seats and whiteboard.",
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
      body: "East was the obvious first pick and it failed. North violates both constraints. Book West instead of retrying East.",
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
      body: "East is the smaller match and it's free. I'll take it.",
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

export function runAgent(
  missionId: MissionId,
  config: RunConfig,
  priorNotes: string[] = [],
): AgentRun {
  const mission = getMission(missionId);
  const recalled = config.memory ? relevantNotes(missionId, priorNotes) : [];
  const missing = missingRequired(config, mission.required);

  const drafts: StepDraft[] = [];

  if (missing.length > 0 && recalled.length === 0) {
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
      body: `This goal needs ${mission.required.join(" and ")}. Guessing would make me a chatbot again.`,
    });
    drafts.push({
      kind: "error",
      title: "Blocked",
      body: `Missing tool${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Attach ${missing.length > 1 ? "them" : "it"} and run again.`,
    });
  } else if (missionId === "tokyo-weekend") {
    drafts.push(...buildTokyo(config, recalled));
  } else if (missionId === "dinner-tip") {
    drafts.push(...buildDinner(config, recalled));
  } else {
    drafts.push(...buildRoom(config, recalled));
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
