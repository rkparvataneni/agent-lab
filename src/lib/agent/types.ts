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
