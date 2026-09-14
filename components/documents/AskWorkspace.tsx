"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AnswerCard } from "@/components/documents/AnswerCard";
import { useAsk } from "@/components/documents/use-qa";
import type { AIResponse } from "@/lib/domain/types";
import { addHistoryEntry, useQuestionHistory } from "@/lib/ask/history";
import { getSectionsForFixture } from "@/lib/documents/sections";
import { useDocuments } from "@/lib/documents/store";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AISkeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";

const SUGGESTED_QUESTIONS = [
  "What are my payment terms?",
  "When can either party terminate this agreement?",
  "Who owns the work after payment?",
  "Is there a restrictive clause?",
  "How long does the restrictive clause last?",
  "What happens if payment is late?",
  "How is liability handled?",
  "How are disputes handled?",
] as const;

interface ThreadEntry {
  readonly question: string;
  readonly response: AIResponse;
}

/**
 * Ask workspace: document-scoped Q&A with suggestions, composer, thread,
 * evidence jumps, follow-ups, and question history. Never a generic
 * chatbot — scope is always visible and answers always carry evidence
 * or an honest safe shape.
 */
export function AskWorkspace() {
  const searchParams = useSearchParams();
  const documents = useDocuments();
  const history = useQuestionHistory();
  const { turn, ask, cancel } = useAsk();

  // Deep-link initial state from Review (/ask?doc=<id>&section=<sectionId>).
  // Lazy initializers: search params are available on first render, so no
  // synchronizing effect is needed.
  const [docId, setDocId] = useState<string | null>(() => searchParams.get("doc"));
  const [compareId, setCompareId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(() => searchParams.get("section"));
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<readonly ThreadEntry[]>([]);
  const [focusQuestion, setFocusQuestion] = useState<string | null>(null);

  const selectedDoc = documents.find((doc) => doc.id === (docId ?? documents[0]?.id)) ?? null;
  const compareDoc =
    compareId === null ? null : (documents.find((doc) => doc.id === compareId) ?? null);
  const sections =
    selectedDoc === null
      ? []
      : (selectedDoc.sections ?? getSectionsForFixture(selectedDoc.fixtureId, selectedDoc.id));
  const scopedSection =
    sectionId === null ? null : (sections.find((section) => section.id === sectionId) ?? null);

  // Deep-link validation happens at selection time: unknown ids fall back
  // to the first document, unknown sections render no scope chip.
  function descriptorOf(id: string) {
    const doc = documents.find((item) => item.id === id);
    if (doc === undefined) {
      return null;
    }
    return {
      documentId: doc.id,
      fixtureId: doc.fixtureId,
      title: doc.title,
      version: doc.currentVersion,
    };
  }

  async function submit(question: string): Promise<void> {
    const trimmed = question.trim();
    if (trimmed === "" || selectedDoc === null) {
      return;
    }
    const descriptors = [
      descriptorOf(selectedDoc.id),
      compareDoc === null ? null : descriptorOf(compareDoc.id),
    ].flatMap((descriptor) => (descriptor === null ? [] : [descriptor]));
    const historyTurns = threads.slice(-3).map((entry) => ({
      question: entry.question,
      answerSummary: entry.response.answer.slice(0, 300),
    }));
    setDraft("");
    // Recording happens here, in the submit event — never in an effect.
    const outcome = await ask(descriptors, trimmed, {
      sectionId,
      history: historyTurns,
    });
    if (outcome.status === "cancelled") {
      return;
    }
    if (outcome.response !== null) {
      const response = outcome.response;
      setThreads((current) => [...current, { question: trimmed, response }]);
      const status =
        response.classification === "missing-information"
          ? "insufficient"
          : response.classification === "document-fact" ||
              response.classification === "document-interpretation"
            ? "ready"
            : "out-of-scope";
      addHistoryEntry({
        question: trimmed,
        timestamp: new Date().toISOString(),
        documentId: selectedDoc.id,
        version: selectedDoc.currentVersion,
        status,
      });
      setFocusQuestion(trimmed);
    } else {
      addHistoryEntry({
        question: trimmed,
        timestamp: new Date().toISOString(),
        documentId: selectedDoc.id,
        version: selectedDoc.currentVersion,
        status: "error",
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit(draft);
  }

  // Recording happens in submit(); this component only renders state.

  const docOptions = useMemo(
    () =>
      documents.map((doc) => ({
        value: doc.id,
        label: `${doc.title} (v${doc.currentVersion})`,
      })),
    [documents],
  );

  const recentForDoc = history.filter(
    (entry) => selectedDoc !== null && entry.documentId === selectedDoc.id,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Heading level={1}>Ask</Heading>
        <Text tone="secondary">
          Ask what your document says. Every answer cites its evidence — or says honestly when it
          can&apos;t.
        </Text>
      </div>

      <div
        aria-label="Answer scope"
        className="rounded-lg border border-dashed border-border bg-surface px-4 py-3"
      >
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Scope:</span>{" "}
          {selectedDoc === null
            ? "no document selected"
            : `${selectedDoc.title}${compareDoc === null ? "" : ` + ${compareDoc.title}`}`}
          {scopedSection === null ? "" : ` · in ${scopedSection.title}`} —{" "}
          <span className="italic">
            Don&apos;t just trust the AI. Verify it against the document.
          </span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Document"
          value={selectedDoc?.id ?? ""}
          onChange={(event) => {
            setDocId(event.target.value || null);
            setSectionId(null);
          }}
          options={docOptions}
        />
        <Select
          label="Also include (compare scope)"
          value={compareDoc?.id ?? ""}
          onChange={(event) => setCompareId(event.target.value || null)}
          options={[
            { value: "", label: "Just this document" },
            ...docOptions.filter((option) => option.value !== selectedDoc?.id),
          ]}
        />
      </div>

      {scopedSection !== null ? (
        <div className="flex items-center gap-2 rounded-md bg-ai-bg px-3 py-2 text-sm">
          <span>
            Scoped to <strong>{scopedSection.title}</strong>
          </span>
          <Button variant="tertiary" size="sm" onClick={() => setSectionId(null)}>
            Clear scope
          </Button>
        </div>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-4">
        {threads.map((entry, index) => (
          <div key={`${entry.question}-${index}`} className="flex flex-col gap-2">
            <p className="text-base font-medium">Q: {entry.question}</p>
            <AnswerCard
              response={entry.response}
              headingRef={
                focusQuestion === null || entry.question !== focusQuestion
                  ? undefined
                  : (node) => {
                      if (node !== null) {
                        setFocusQuestion(null);
                        node.focus();
                      }
                    }
              }
              onFollowUp={(followUp) => {
                void submit(followUp);
              }}
            />
          </div>
        ))}

        {turn !== null && turn.status === "loading" ? (
          <div role="status" aria-label="Finding evidence">
            <p className="mb-2 text-sm text-text-secondary">Gemini · Retrieving evidence…</p>
            <AISkeleton />
          </div>
        ) : null}

        {turn !== null && turn.status === "unavailable" ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-base font-medium">Answers are temporarily unavailable</p>
            <Text tone="secondary" className="mt-1 text-sm">
              The question is kept above — retry in a moment. Your document and scope are unchanged.
            </Text>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void submit(turn.question);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        {turn !== null && turn.status === "error" ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-base font-medium">The answer didn&apos;t come back</p>
            <Text tone="secondary" className="mt-1 text-sm">
              {turn.errorMessage ?? "Something went wrong."} Your question and scope are preserved.
            </Text>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void submit(turn.question);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        {threads.length === 0 && turn === null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void submit(question);
                  }}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Ask about this document"
          placeholder="Type your question…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={draft.trim() === "" || turn?.status === "loading"}>
            Ask
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft("")}
            disabled={draft === ""}
          >
            Clear
          </Button>
          {turn?.status === "loading" ? (
            <Button type="button" variant="secondary" onClick={cancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {recentForDoc.length > 0 ? (
        <section aria-label="Recent questions" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Recent questions
          </h2>
          <ul className="flex flex-col gap-1">
            {recentForDoc.slice(0, 5).map((entry) => (
              <li key={`${entry.timestamp}-${entry.question}`}>
                <button
                  type="button"
                  onClick={() => {
                    void submit(entry.question);
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-bg"
                >
                  {entry.question}
                  <span className="ml-2 text-xs text-text-secondary">{entry.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
