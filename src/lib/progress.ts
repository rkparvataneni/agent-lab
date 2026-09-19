import { LESSON_SLUGS, type LessonSlug } from "./lessons";

const STORAGE_KEY = "agentic-lab-progress-v1";

export type ProgressState = {
  completed: LessonSlug[];
};

export const EMPTY_PROGRESS: ProgressState = { completed: [] };

export function emptyProgress(): ProgressState {
  return EMPTY_PROGRESS;
}

export function readProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    const completed = (parsed.completed ?? []).filter((slug): slug is LessonSlug =>
      LESSON_SLUGS.includes(slug),
    );
    return { completed };
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(state: ProgressState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markComplete(slug: LessonSlug): ProgressState {
  const current = readProgress();
  if (current.completed.includes(slug)) return current;
  const next = { completed: [...current.completed, slug] };
  writeProgress(next);
  return next;
}

export function resetProgress(): ProgressState {
  const next = emptyProgress();
  writeProgress(next);
  return next;
}
