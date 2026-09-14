"use client";

/**
 * Question history — metadata only (question, timestamp, document, version,
 * status). Answers are never persisted: re-opening a question re-asks it.
 * sessionStorage keeps history tab-local, matching the document store.
 */
import { useSyncExternalStore } from "react";
import type { QuestionHistoryEntry } from "@/lib/domain/types";

const STORAGE_KEY = "plainterms-qa-history-v1";
const MAX_ENTRIES = 20;

type Listener = () => void;

let cache: readonly QuestionHistoryEntry[] | null = null;
const listeners = new Set<Listener>();

function readStorage(): readonly QuestionHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as readonly QuestionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: readonly QuestionHistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable — memory cache still works for the session.
  }
}

function getSnapshot(): readonly QuestionHistoryEntry[] {
  if (cache === null) {
    cache = readStorage();
  }
  return cache;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addHistoryEntry(entry: QuestionHistoryEntry): void {
  cache = [entry, ...getSnapshot()].slice(0, MAX_ENTRIES);
  writeStorage(cache);
  for (const listener of listeners) {
    listener();
  }
}

export function useQuestionHistory(): readonly QuestionHistoryEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}
