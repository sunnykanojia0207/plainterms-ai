/**
 * Action Pack structured-output schemas. Strict zod validation + TS types
 * plus the Gemini responseJsonSchema mirror. Evidence is required for
 * obligation/date/review/clarify/lawyer items; info-needed reports absence
 * and checklist items may frame confirmations — those two may carry null.
 */
import { z } from "zod";

export const actionPackKindSchema = z.enum([
  "obligation",
  "date",
  "review",
  "clarify",
  "lawyer",
  "checklist",
  "info-needed",
]);
export type ActionPackKind = z.infer<typeof actionPackKindSchema>;

export const actionPrioritySchema = z.enum(["high", "medium", "low"]);
export type ActionPriorityAI = z.infer<typeof actionPrioritySchema>;

export const actionPackEvidenceSchema = z
  .object({
    sectionId: z.string().min(1).max(80),
    sectionTitle: z.string().min(1).max(160),
    quote: z.string().min(20).max(600),
    pageNumber: z.number().int().positive(),
  })
  .strict();
export type ActionPackEvidenceAI = z.infer<typeof actionPackEvidenceSchema>;

const EVIDENCE_REQUIRED_KINDS: readonly ActionPackKind[] = [
  "obligation",
  "date",
  "review",
  "clarify",
  "lawyer",
];

export const actionPackItemSchema = z
  .object({
    kind: actionPackKindSchema,
    title: z.string().min(1).max(120),
    summary: z.string().min(20).max(600),
    priority: actionPrioritySchema,
    evidence: actionPackEvidenceSchema.nullable(),
    uncertainty: z.string().max(400).nullable(),
    nextStep: z.string().max(300).nullable(),
  })
  .strict()
  .superRefine((item, context) => {
    if (
      item.evidence === null &&
      (EVIDENCE_REQUIRED_KINDS as readonly string[]).includes(item.kind)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${item.kind} items require evidence.`,
      });
    }
  });
export type ActionPackItemAI = z.infer<typeof actionPackItemSchema>;

export const actionPackResponseSchema = z
  .object({
    items: z.array(actionPackItemSchema).min(1).max(30),
  })
  .strict();
export type ActionPackResponseAI = z.infer<typeof actionPackResponseSchema>;

export const ACTION_PACK_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["obligation", "date", "review", "clarify", "lawyer", "checklist", "info-needed"],
          },
          title: { type: "string" },
          summary: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: ["object", "null"],
            properties: {
              sectionId: { type: "string" },
              sectionTitle: { type: "string" },
              quote: { type: "string" },
              pageNumber: { type: "integer" },
            },
            required: ["sectionId", "sectionTitle", "quote", "pageNumber"],
          },
          uncertainty: { type: ["string", "null"] },
          nextStep: { type: ["string", "null"] },
        },
        required: ["kind", "title", "summary", "priority", "evidence", "uncertainty", "nextStep"],
      },
    },
  },
  required: ["items"],
} as const;
