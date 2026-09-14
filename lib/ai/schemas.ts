/**
 * Structured-output schemas — single source for AI response shapes.
 * zod owns validation + TypeScript types (z.infer). The Gemini
 * `responseJsonSchema` companions are hand-written mirrors kept beside
 * each schema; a unit test asserts both accept the same sample payloads.
 *
 * Strictness: every object is .strict() (unexpected fields reject), every
 * finding requires evidence (citation-or-silence is enforced separately
 * in lib/ai/evidence.ts against the actual document text).
 */
import { z } from "zod";

export const confidenceIndicatorSchema = z.enum(["very-high", "high", "moderate", "low"]);
export type ConfidenceIndicator = z.infer<typeof confidenceIndicatorSchema>;

export const evidenceReferenceSchema = z
  .object({
    sectionId: z.string().min(1).max(80),
    sectionTitle: z.string().min(1).max(160),
    /** Smallest excerpt sufficient to support the finding. */
    quote: z.string().min(20).max(600),
    pageNumber: z.number().int().positive(),
  })
  .strict();
export type EvidenceReferenceAI = z.infer<typeof evidenceReferenceSchema>;

export const documentSummarySchema = z
  .object({
    /** 5–8 concise points answering: about, parties, duties, money/timing, review areas. */
    points: z.array(z.string().min(10).max(280)).min(5).max(8),
    parties: z.array(z.string().min(1).max(120)).min(1).max(6),
    effectiveDate: z.string().max(80).nullable(),
    areasToReview: z.array(z.string().min(1).max(160)).min(1).max(6),
  })
  .strict();
export type DocumentSummaryAI = z.infer<typeof documentSummarySchema>;

export const clauseCategorySchema = z.enum([
  "payment",
  "term",
  "termination",
  "confidentiality",
  "intellectual-property",
  "restrictions",
  "liability",
  "dispute-resolution",
  "renewal",
  "notice",
  "responsibilities",
]);
export type ClauseCategory = z.infer<typeof clauseCategorySchema>;

export const clauseFindingSchema = z
  .object({
    category: clauseCategorySchema,
    title: z.string().min(1).max(120),
    /** Plain-language meaning. Never a legal conclusion. */
    interpretation: z.string().min(20).max(800),
    evidence: evidenceReferenceSchema,
    confidence: confidenceIndicatorSchema,
    /** Stated plainly when wording is unclear; null when clear. */
    ambiguity: z.string().max(400).nullable(),
  })
  .strict();
export type ClauseFinding = z.infer<typeof clauseFindingSchema>;

export const obligationSchema = z
  .object({
    party: z.enum(["you", "client", "both"]),
    obligation: z.string().min(10).max(300),
    trigger: z.string().max(200).nullable(),
    /** Only when explicitly stated. Never inferred. */
    deadline: z.string().max(200).nullable(),
    evidence: evidenceReferenceSchema,
    importance: z.enum(["high", "normal"]),
  })
  .strict();
export type ObligationAI = z.infer<typeof obligationSchema>;

export const importantDateSchema = z
  .object({
    label: z.string().min(1).max(160),
    date: z.string().min(1).max(80),
    evidence: evidenceReferenceSchema,
  })
  .strict();
export type ImportantDateAI = z.infer<typeof importantDateSchema>;

export const concernSeveritySchema = z.enum([
  "potential-concern",
  "worth-reviewing",
  "important-obligation",
  "unusual-wording",
  "ambiguous-wording",
  "needs-clarification",
]);
export type ConcernSeverity = z.infer<typeof concernSeveritySchema>;

export const potentialConcernSchema = z
  .object({
    title: z.string().min(1).max(120),
    concern: z.string().min(20).max(600),
    severity: concernSeveritySchema,
    evidence: evidenceReferenceSchema,
    confidence: confidenceIndicatorSchema,
  })
  .strict();
export type PotentialConcernAI = z.infer<typeof potentialConcernSchema>;

/** Full document-analysis response (summary + obligations + dates + concerns). */
export const documentAnalysisSchema = z
  .object({
    summary: documentSummarySchema,
    obligations: z.array(obligationSchema).max(12),
    dates: z.array(importantDateSchema).max(10),
    concerns: z.array(potentialConcernSchema).max(8),
  })
  .strict();
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

/** Clause-intelligence response: findings only. */
export const clauseIntelligenceSchema = z
  .object({
    clauses: z.array(clauseFindingSchema).max(12),
  })
  .strict();
export type ClauseIntelligence = z.infer<typeof clauseIntelligenceSchema>;

/**
 * Gemini `responseJsonSchema` companions. Plain JSON Schema (no zod
 * dependency leaks into the provider call). Kept in this file so schema
 * and transport shape evolve together.
 */
export const DOCUMENT_ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "object",
      properties: {
        points: { type: "array", items: { type: "string" } },
        parties: { type: "array", items: { type: "string" } },
        effectiveDate: { type: ["string", "null"] },
        areasToReview: { type: "array", items: { type: "string" } },
      },
      required: ["points", "parties", "effectiveDate", "areasToReview"],
    },
    obligations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          party: { type: "string", enum: ["you", "client", "both"] },
          obligation: { type: "string" },
          trigger: { type: ["string", "null"] },
          deadline: { type: ["string", "null"] },
          evidence: { $ref: "#/$defs/evidence" },
          importance: { type: "string", enum: ["high", "normal"] },
        },
        required: ["party", "obligation", "trigger", "deadline", "evidence", "importance"],
      },
    },
    dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          date: { type: "string" },
          evidence: { $ref: "#/$defs/evidence" },
        },
        required: ["label", "date", "evidence"],
      },
    },
    concerns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          concern: { type: "string" },
          severity: {
            type: "string",
            enum: [
              "potential-concern",
              "worth-reviewing",
              "important-obligation",
              "unusual-wording",
              "ambiguous-wording",
              "needs-clarification",
            ],
          },
          evidence: { $ref: "#/$defs/evidence" },
          confidence: {
            type: "string",
            enum: ["very-high", "high", "moderate", "low"],
          },
        },
        required: ["title", "concern", "severity", "evidence", "confidence"],
      },
    },
  },
  required: ["summary", "obligations", "dates", "concerns"],
  $defs: {
    evidence: {
      type: "object",
      properties: {
        sectionId: { type: "string" },
        sectionTitle: { type: "string" },
        quote: { type: "string" },
        pageNumber: { type: "integer" },
      },
      required: ["sectionId", "sectionTitle", "quote", "pageNumber"],
    },
  },
} as const;

export const CLAUSE_INTELLIGENCE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "payment",
              "term",
              "termination",
              "confidentiality",
              "intellectual-property",
              "restrictions",
              "liability",
              "dispute-resolution",
              "renewal",
              "notice",
              "responsibilities",
            ],
          },
          title: { type: "string" },
          interpretation: { type: "string" },
          evidence: {
            type: "object",
            properties: {
              sectionId: { type: "string" },
              sectionTitle: { type: "string" },
              quote: { type: "string" },
              pageNumber: { type: "integer" },
            },
            required: ["sectionId", "sectionTitle", "quote", "pageNumber"],
          },
          confidence: {
            type: "string",
            enum: ["very-high", "high", "moderate", "low"],
          },
          ambiguity: { type: ["string", "null"] },
        },
        required: ["category", "title", "interpretation", "evidence", "confidence", "ambiguity"],
      },
    },
  },
  required: ["clauses"],
} as const;
