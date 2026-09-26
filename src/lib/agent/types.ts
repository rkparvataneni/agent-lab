export const TOOL_NAMES = [
  "weather",
  "calculator",
  "search",
  "calendar",
  "rooms",
  "notes",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const MISSION_IDS = [
  "tokyo-weekend",
  "dinner-tip",
  "book-room",
] as const;

export type MissionId = (typeof MISSION_IDS)[number];

export type StepKind =
  | "thought"
  | "action"
  | "observation"
  | "plan"
  | "replan"
  | "memory"
  | "answer"
  | "error";

export type AgentStep = {
  id: string;
  kind: StepKind;
  title: string;
  body: string;
  tool?: ToolName;
  args?: Record<string, string | number | boolean>;
};

export type ToolFlags = Record<ToolName, boolean>;

export type RunConfig = {
  tools: ToolFlags;
  memory: boolean;
  planning: boolean;
  injectFailure: boolean;
  /** When false, the model may answer with no observation in state. */
  grounding: boolean;
  /** 0 keeps the mode (the tool token). High values can skip the tool call. */
  temperature: number;
  /** Nucleus cutoff. A tight top-p collapses back onto the mode. */
  topP: number;
  /** Hard cap on the completion. Too small truncates tool-call JSON. */
  maxTokens: number;
  /** First model call returns HTTP 429 with Retry-After. */
  injectRateLimit: boolean;
  /** Sleep the header, then retry once. Immediate retries burn RPM. */
  honorRetryAfter: boolean;
  /** The user left required slots empty. Ask once. Do not invent them. */
  vagueGoal: boolean;
  /** One of two parallel tools fails. Keep the success and retry only the failure. */
  partialFailure: boolean;
  /** The next model call would exceed the token budget. */
  overBudget: boolean;
  /** The user token was copied into the prompt. Refuse the call. */
  leakSecret: boolean;
  /** Show the router. An unclear goal stops instead of picking a desk. */
  routeExplicitly: boolean;
  unclearRoute: boolean;
  /** create_agent must still prove a tool ran. */
  assertGrounding: boolean;
  dropAssertion: boolean;
  /** Interrupt before the write. */
  awaitApproval: boolean;
  approveWrite: boolean;
  /** Supervisor hands off an allow-list. */
  handoffCheck: boolean;
  widenHandoff: boolean;
  /** The eval looks at message order, not the final sentence. */
  checkTrajectory: boolean;
  failEval: boolean;
  /** Tool text that says "ignore previous instructions". */
  injectionCheck: boolean;
  obeyInjection: boolean;
};

export type RunStatus = "answered" | "blocked" | "failed";

export type AgentRun = {
  missionId: MissionId;
  goal: string;
  steps: AgentStep[];
  answer: string | null;
  notes: string[];
  status: RunStatus;
  toolsUsed: ToolName[];
};

export type Mission = {
  id: MissionId;
  title: string;
  goal: string;
  blurb: string;
  required: ToolName[];
  helpful: ToolName[];
};

export const DEFAULT_TOOLS: ToolFlags = {
  weather: true,
  calculator: true,
  search: true,
  calendar: true,
  rooms: true,
  notes: true,
};

export function allTools(on: boolean): ToolFlags {
  return {
    weather: on,
    calculator: on,
    search: on,
    calendar: on,
    rooms: on,
    notes: on,
  };
}
