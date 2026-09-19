import type { Mission, MissionId } from "./types";

export const MISSIONS: Mission[] = [
  {
    id: "tokyo-weekend",
    title: "Tokyo weekend",
    goal: "Should I pack an umbrella for Tokyo this weekend?",
    blurb: "A question that looks conversational but needs a live forecast.",
    required: ["weather"],
    helpful: ["notes"],
  },
  {
    id: "dinner-tip",
    title: "Dinner check",
    goal: "What's a 17% tip on an $86 dinner, and is Katsu House still open?",
    blurb: "Two facts, two tools: arithmetic and a lookup.",
    required: ["calculator", "search"],
    helpful: ["notes"],
  },
  {
    id: "book-room",
    title: "Room booking",
    goal: "Reserve a room for 4 people tomorrow at 2pm that has a whiteboard.",
    blurb: "A multi-step job that can fail and has to recover.",
    required: ["calendar", "rooms"],
    helpful: ["notes"],
  },
];

export function getMission(id: MissionId): Mission {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) {
    throw new Error(`Unknown mission: ${id}`);
  }
  return mission;
}

export function chatbotReply(id: MissionId): string {
  switch (id) {
    case "tokyo-weekend":
      return "I don't have live weather. Tokyo can be rainy in September, so you might pack an umbrella just in case — but that's a guess, not a forecast.";
    case "dinner-tip":
      return "17% of $86 is roughly $15. I can't see whether Katsu House is open right now. You'll need to check their site or Maps.";
    case "book-room":
      return "I can't actually look at your calendar or the room system. You'll need to check both and book it yourself.";
  }
}
