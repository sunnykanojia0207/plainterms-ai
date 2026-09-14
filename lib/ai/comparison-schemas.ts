/**
 * Comparison structured-output schemas — strict zod validation + TS types
 * plus the Gemini responseJsonSchema mirror. Cross-field rules (changed
 * needs both evidences, added needs right-only, removed needs left-only)
 * are enforced by superRefine. Evidence text itself is validated against
 * the source documents in lib/ai/compare.ts (citation-or-silence).
 */
import { z } from "zod";

export const comparisonEvidenceSchema = z
  .object({
    version: z.enum(["v1", "v2"]),
    sectionId: z.string().min(1).max(80),
    sectionTitle: z.string().min(1).max(160),
    quote: z.string().min(20).max(600),
    pageNumber: z.number().int().positive(),
  })
  .strict();
export type ComparisonEvidenceAI = z.infer<typeof comparisonEvidenceSchema>;

export const changeKindSchema = z.enum(["changed", "added", "removed"]);
export type ChangeKind = z.infer<typeof changeKindSchema>;

export const materialitySchema = z.enum(["material", "cosmetic"]);
export type Materiality = z.infer<typeof materialitySchema>;

const changeBase = z.object({
  category: z.enum([
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
  ]),
  kind: changeKindSchema,
  materiality: materialitySchema,
  favors: z.enum(["you", "client", "neutral"]),
  title: z.string().min(1).max(120),
  whatChanged: z.string().min(20).max(400),
  whyItMatters: z.string().min(20).max(600),
  implication: z.string().min(10).max(400),
  questionToConsider: z.string().min(10).max(300),
  nextStep: z.string().min(10).max(300),
  confidence: z.enum(["very-high", "high", "moderate", "low"]),
  leftEvidence: comparisonEvidenceSchema.nullable(),
  rightEvidence: comparisonEvidenceSchema.nullable(),
});

export const comparisonChangeSchema = changeBase.strict().superRefine((change, context) => {
  if (change.kind === "changed") {
    if (change.leftEvidence === null || change.rightEvidence === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Changed findings require both left and right evidence.",
      });
    }
  }
  if (change.kind === "added" && change.rightEvidence === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Added findings require right evidence.",
    });
  }
  if (change.kind === "removed" && change.leftEvidence === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Removed findings require left evidence.",
    });
  }
  if (change.leftEvidence !== null && change.leftEvidence.version !== "v1") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Left evidence must be version v1.",
    });
  }
  if (change.rightEvidence !== null && change.rightEvidence.version !== "v2") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Right evidence must be version v2.",
    });
  }
});
export type ComparisonChangeAI = z.infer<typeof comparisonChangeSchema>;

export const silenceStateSchema = z.enum(["removed", "not-found", "uncertain"]);
export type SilenceStateAI = z.infer<typeof silenceStateSchema>;

export const silenceFindingSchema = z
  .object({
    state: silenceStateSchema,
    subject: z.string().min(1).max(160),
    leftEvidence: comparisonEvidenceSchema,
    rightEvidence: comparisonEvidenceSchema.nullable(),
    whatWeKnow: z.string().min(20).max(600),
    whatRemainsUncertain: z.string().max(400).nullable(),
    questionToConsider: z.string().min(10).max(300),
    confidence: z.enum(["very-high", "high", "moderate", "low"]),
  })
  .strict();
export type SilenceFindingAI = z.infer<typeof silenceFindingSchema>;

export const comparisonResultSchema = z
  .object({
    summary: z.string().min(20).max(400),
    changes: z.array(comparisonChangeSchema).max(20),
    silence: z.array(silenceFindingSchema).max(10),
    verdict: z.string().min(20).max(400),
    verdictDrivers: z.array(z.string().min(1).max(200)).max(3),
  })
  .strict();
export type ComparisonResultAI = z.infer<typeof comparisonResultSchema>;

const EVIDENCE_JSON_SCHEMA = {
  type: "object",
  properties: {
    version: { type: "string", enum: ["v1", "v2"] },
    sectionId: { type: "string" },
    sectionTitle: { type: "string" },
    quote: { type: "string" },
    pageNumber: { type: "integer" },
  },
  required: ["version", "sectionId", "sectionTitle", "quote", "pageNumber"],
};

const CONFIDENCE_JSON_SCHEMA = {
  type: "string",
  enum: ["very-high", "high", "moderate", "low"],
};

export const COMPARISON_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    changes: {
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
          kind: { type: "string", enum: ["changed", "added", "removed"] },
          materiality: { type: "string", enum: ["material", "cosmetic"] },
          favors: { type: "string", enum: ["you", "client", "neutral"] },
          title: { type: "string" },
          whatChanged: { type: "string" },
          whyItMatters: { type: "string" },
          implication: { type: "string" },
          questionToConsider: { type: "string" },
          nextStep: { type: "string" },
          confidence: CONFIDENCE_JSON_SCHEMA,
          leftEvidence: { ...EVIDENCE_JSON_SCHEMA, type: ["object", "null"] },
          rightEvidence: { ...EVIDENCE_JSON_SCHEMA, type: ["object", "null"] },
        },
        required: [
          "category",
          "kind",
          "materiality",
          "favors",
          "title",
          "whatChanged",
          "whyItMatters",
          "implication",
          "questionToConsider",
          "nextStep",
          "confidence",
          "leftEvidence",
          "rightEvidence",
        ],
      },
    },
    silence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          state: { type: "string", enum: ["removed", "not-found", "uncertain"] },
          subject: { type: "string" },
          leftEvidence: EVIDENCE_JSON_SCHEMA,
          rightEvidence: { ...EVIDENCE_JSON_SCHEMA, type: ["object", "null"] },
          whatWeKnow: { type: "string" },
          whatRemainsUncertain: { type: ["string", "null"] },
          questionToConsider: { type: "string" },
          confidence: CONFIDENCE_JSON_SCHEMA,
        },
        required: [
          "state",
          "subject",
          "leftEvidence",
          "rightEvidence",
          "whatWeKnow",
          "whatRemainsUncertain",
          "questionToConsider",
          "confidence",
        ],
      },
    },
    verdict: { type: "string" },
    verdictDrivers: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "changes", "silence", "verdict", "verdictDrivers"],
} as const;
