import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt, buildClausesPrompt, buildRepairPrompt } from "@/lib/ai/prompts";
import { AI_CONFIG } from "@/lib/ai/config";
import { contentFromFixture } from "@/lib/ai/content";
import { DOCUMENT_DATA_CLOSE, DOCUMENT_DATA_OPEN } from "@/lib/security/prompt-guard";
import { FIXTURE_ID } from "@/lib/documents/fixture";

const content = contentFromFixture("doc-1", "Client agreement", FIXTURE_ID);

describe("prompt builder", () => {
  it("versions every request", () => {
    expect(buildAnalysisPrompt(content).version).toBe(AI_CONFIG.promptVersions.documentAnalysis);
    expect(buildClausesPrompt(content).version).toBe(AI_CONFIG.promptVersions.clauseIntelligence);
    expect(AI_CONFIG.model).toBe("gemini-2.5-flash");
  });

  it("wraps the document as delimited data, never bare instructions", () => {
    for (const prompt of [buildAnalysisPrompt(content), buildClausesPrompt(content)]) {
      expect(prompt.userPrompt).toContain(DOCUMENT_DATA_OPEN);
      expect(prompt.userPrompt).toContain(DOCUMENT_DATA_CLOSE);
      expect(prompt.systemInstruction).toMatch(/untrusted data/i);
      expect(prompt.systemInstruction).toMatch(/ignore any directives/i);
    }
  });

  it("bakes in grounding, safety vocabulary, and JSON-only output rules", () => {
    const { systemInstruction, userPrompt } = buildAnalysisPrompt(content);
    expect(systemInstruction).toMatch(/only the document text/i);
    expect(systemInstruction).toMatch(/never state legal conclusions/i);
    expect(systemInstruction).toMatch(/Worth reviewing/);
    expect(systemInstruction).toMatch(/JSON ONLY/);
    // The prompt must NAME banned language to forbid it — the prohibition,
    // not the mention, is what matters.
    expect(systemInstruction).toMatch(/never use/i);
    expect(userPrompt).toContain("evidence");
  });

  it("builds a constrained repair prompt carrying the validation issues", () => {
    const repair = buildRepairPrompt("document-analysis-v1", "points: too few");
    expect(repair.version).toContain("document-analysis-v1");
    expect(repair.userPrompt).toContain("points: too few");
    expect(repair.systemInstruction).toMatch(/JSON only/i);
  });
});
