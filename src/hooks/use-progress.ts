"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LessonSlug } from "@/lib/lessons";
import {
  EMPTY_PROGRESS,
  markComplete,
  readProgress,
  resetProgress,
  type ProgressState,
} from "@/lib/progress";

const CHANGE_EVENT = "agentic-lab-progress";
const CLIENT_READY = true;
const SERVER_READY = false;

let snapshot: ProgressState = EMPTY_PROGRESS;
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
  return EMPTY_PROGRESS;
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => CLIENT_READY,
    () => SERVER_READY,
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
