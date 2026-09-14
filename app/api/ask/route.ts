import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { PlainTermsQAService } from "@/lib/ai/qa-service";
import { aiErrorResponse } from "@/lib/ai/route-errors";

const documentSchema = z
  .object({
    documentId: z.string().min(1).max(120),
    fixtureId: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    version: z.number().int().positive().max(1000).default(1),
  })
  .strict();

const historyTurnSchema = z
  .object({
    question: z.string().min(1).max(500),
    answerSummary: z.string().min(1).max(2000),
  })
  .strict();

const bodySchema = z
  .object({
    documents: z.array(documentSchema).min(1).max(2),
    question: z.string().min(1).max(500),
    sectionId: z.string().min(1).max(80).nullish(),
    history: z.array(historyTurnSchema).max(10).default([]),
  })
  .strict();

/**
 * POST /api/ask — evidence-grounded answers for one or two documents.
 * Body: { documents[], question, sectionId?, history? }. Only validated,
 * evidence-checked answers are returned; prompts and keys stay server-side.
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse((await request.json()) as unknown);
  } catch {
    return NextResponse.json(
      {
        code: "bad-request",
        message: "Request body must be { documents[1-2], question, sectionId?, history? }.",
      },
      { status: 400 },
    );
  }

  // Source resolution (fixture vs parsed upload record) happens inside
  // the service via resolveDocumentContent; unknown documents surface as
  // 404 unknown-document through aiErrorResponse.
  const service = new PlainTermsQAService();
  try {
    const { response } = await service.ask({
      documents: body.documents,
      question: body.question,
      sectionId: body.sectionId ?? null,
      history: body.history,
    });
    return NextResponse.json(response);
  } catch (error) {
    return aiErrorResponse(error, requestId, {
      documentId: body.documents[0]?.documentId,
    });
  }
}
