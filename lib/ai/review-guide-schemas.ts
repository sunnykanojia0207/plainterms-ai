/**
 * Review Guide structured-output schemas. Strict zod validation + TS types
 * plus the Gemini responseJsonSchema mirror. Evidence is required for
 * every kind except confirm (which reports missing or ambiguous
 * information). Neutral questions only — never demanded outcomes.
 */
import { z } from "zod";

export const reviewGuideKindSchema = z.enum([
  "topic",
  "party-question",
  "lawyer-question",
  "clarification",
  "confirm",
  "checklist",
]);
export type ReviewGuideKind = z.infer<typeof reviewGuideKindSchema>;

export const reviewGuideEvidenceSchema = z
  .object({
    documentId: z.string().min(1).max(120),
    sectionId: z.string().min(1).max(80),
    sectionTitle: z.string().min(1).max(160),
    quote: z.string().min(20).max(600),
    pageNumber: z.number().int().positive(),
  })
  .strict();
export type ReviewGuideEvidenceAI = z.infer<typeof reviewGuideEvidenceSchema>;

export const reviewGuideItemSchema = z
  .object({
    kind: reviewGuideKindSchema,
    title: z.string().min(1).max(120),
    summary: z.string().min(20).max(600),
    priority: z.enum(["high", "medium", "low"]),
    evidence: reviewGuideEvidenceSchema.nullable(),
    uncertainty: z.string().max(400).nullable(),
  })
  .strict()
  .superRefine((item, context) => {
    if (item.evidence === null && item.kind !== "confirm") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${item.kind} items require evidence.`,
      });
    }
  });
export type ReviewGuideItemAI = z.infer<typeof reviewGuideItemSchema>;

export const reviewGuideResponseSchema = z
  .object({
    items: z.array(reviewGuideItemSchema).min(1).max(30),
  })
  .strict();
export type ReviewGuideResponseAI = z.infer<typeof reviewGuideResponseSchema>;

export const REVIEW_GUIDE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "topic",
              "party-question",
              "lawyer-question",
              "clarification",
              "confirm",
              "checklist",
            ],
          },
          title: { type: "string" },
          summary: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: ["object", "null"],
            properties: {
              documentId: { type: "string" },
              sectionId: { type: "string" },
              sectionTitle: { type: "string" },
              quote: { type: "string" },
              pageNumber: { type: "integer" },
            },
            required: ["documentId", "sectionId", "sectionTitle", "quote", "pageNumber"],
          },
          uncertainty: { type: ["string", "null"] },
        },
        required: ["kind", "title", "summary", "priority", "evidence", "uncertainty"],
      },
    },
  },
  required: ["items"],
} as const;
