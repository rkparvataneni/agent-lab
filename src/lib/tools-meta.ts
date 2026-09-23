import type { ToolName } from "./agent/types";

export const TOOL_META: Record<
  ToolName,
  { label: string; hint: string }
> = {
  weather: { label: "weather", hint: "Forecast for a city and date range" },
  calculator: { label: "calculator", hint: "Exact arithmetic" },
  search: { label: "search", hint: "Look up hours, facts, pages" },
  calendar: { label: "calendar", hint: "Check whether a slot is free" },
  rooms: { label: "rooms", hint: "Write. List rooms, or reserve one" },
  notes: { label: "notes", hint: "Store a fact for a later thread" },
};
