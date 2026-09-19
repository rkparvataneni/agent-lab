"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LessonSlug } from "@/lib/lessons";
import {
  emptyProgress,
  markComplete,
  readProgress,
  resetProgress,
  type ProgressState,
} from "@/lib/progress";

const CHANGE_EVENT = "agentic-lab-progress";

let snapshot: ProgressState = emptyProgress();
let snapshotKey = "";

function currentKey() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("agentic-lab-progress-v1") ?? "";
}

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

function getSnapshot(): ProgressState {
  const key = currentKey();
  if (key === snapshotKey) return snapshot;
  snapshotKey = key;
  snapshot = readProgress();
  return snapshot;
}

function getServerSnapshot(): ProgressState {
  return emptyProgress();
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const complete = useCallback((slug: LessonSlug) => {
    markComplete(slug);
    emitChange();
  }, []);

  const reset = useCallback(() => {
    resetProgress();
    emitChange();
  }, []);

  return useMemo(
    () => ({ ...state, ready, complete, reset }),
    [complete, ready, reset, state],
  );
}
