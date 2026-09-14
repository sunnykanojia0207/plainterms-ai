/**
 * Q&A structured-output schemas. Strict zod validation + TS types plus the
 * Gemini responseJsonSchema mirror. Classification drives safe shapes:
 * substantive answers require evidence; anything else must carry none.
 */
import { z } from "zod";

export const questionClassificationSchema = z.enum([
  "document-fact",
  "document-interpretation",
  "missing-information",
  "out-of-scope-legal-advice",
  "unrelated",
]);
export type QuestionClassificationAI = z.infer<typeof questionClassificationSchema>;

export const answerEvidenceSchema = z
  .object({
    sectionId: z.string().min(1).max(80),
    sectionTitle: z.string().min(1).max(160),
    quote: z.string().min(20).max(600),
    pageNumber: z.number().int().positive(),
  })
  .strict();
export type AnswerEvidenceAI = z.infer<typeof answerEvidenceSchema>;

export const documentAnswerSchema = z
  .object({
    classification: questionClassificationSchema,
    /** Short answer: 2–5 concise paragraphs or bullets. Never a legal opinion. */
    answer: z.string().min(10).max(1500),
    evidence: z.array(answerEvidenceSchema).max(6),
    /** Empty string when the document fully establishes the answer. */
    uncertainty: z.string().max(400),
    followUps: z.array(z.string().min(5).max(200)).max(4),
    counselQuestions: z.array(z.string().min(5).max(300)).max(3),
    confidence: z.enum(["very-high", "high", "moderate", "low"]),
  })
  .strict()
  .superRefine((result, context) => {
    const substantive =
      result.classification === "document-fact" ||
      result.classification === "document-interpretation";
    if (substantive && result.evidence.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Substantive answers require at least one evidence reference.",
      });
    }
    if (!substantive && result.evidence.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non-substantive answers must not carry evidence.",
      });
    }
  });
export type DocumentAnswerAI = z.infer<typeof documentAnswerSchema>;

export const QA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    classification: {
      type: "string",
      enum: [
        "document-fact",
        "document-interpretation",
        "missing-information",
        "out-of-scope-legal-advice",
        "unrelated",
      ],
    },
    answer: { type: "string" },
    evidence: {
      type: "array",
      items: {
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
    uncertainty: { type: "string" },
    followUps: { type: "array", items: { type: "string" } },
    counselQuestions: { type: "array", items: { type: "string" } },
    confidence: {
      type: "string",
      enum: ["very-high", "high", "moderate", "low"],
    },
  },
  required: [
    "classification",
    "answer",
    "evidence",
    "uncertainty",
    "followUps",
    "counselQuestions",
    "confidence",
  ],
} as const;
