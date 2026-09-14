import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { PlainTermsReviewService } from "@/lib/ai/review-service";
import { aiErrorResponse } from "@/lib/ai/route-errors";
import { logger } from "@/lib/privacy/log";

const bodySchema = z
  .object({
    fixtureId: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    version: z.number().int().positive().max(1000).default(1),
  })
  .strict();

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

/**
 * POST /api/analysis/[documentId] — runs document understanding + clause
 * intelligence for a fixture-backed document. Body: { fixtureId, title,
 * version? }. Prompts, keys, and raw model output never leave the server;
 * only validated, evidence-checked findings are returned.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const requestId = crypto.randomUUID();

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse((await request.json()) as unknown);
  } catch {
    return NextResponse.json(
      {
        code: "bad-request",
        message: "Request body must be { fixtureId, title, version? }.",
      },
      { status: 400 },
    );
  }

  // Source resolution (fixture vs parsed upload record) happens inside
  // the service; unknown documents surface as 404 unknown-document.
  const service = new PlainTermsReviewService((id) =>
    Promise.resolve({
      documentId: id,
      title: body.title,
      fixtureId: body.fixtureId,
      version: body.version,
    }),
  );

  try {
    const [summary, findings, clauses, obligations, dates] = await Promise.all([
      service.getSummary(documentId),
      service.getFindings(documentId),
      service.getClauses(documentId),
      service.getObligations(documentId),
      service.getKeyDates(documentId),
    ]);
    logger.info("Analysis request served", { documentId, requestId });
    return NextResponse.json({
      documentId,
      summary: summary.summary,
      keyFacts: summary.keyFacts,
      findings,
      clauses,
      obligations,
      dates,
    });
  } catch (error) {
    return aiErrorResponse(error, requestId, { documentId });
  }
}
