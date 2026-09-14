import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { PlainTermsReviewGuideService } from "@/lib/ai/review-guide-service";
import { aiErrorResponse } from "@/lib/ai/route-errors";
import { logger } from "@/lib/privacy/log";

const sideSchema = z
  .object({
    documentId: z.string().min(1).max(120),
    fixtureId: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    version: z.number().int().positive().max(1000).default(1),
  })
  .strict();

const bodySchema = z
  .object({
    fixtureId: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    version: z.number().int().positive().max(1000).default(1),
    compareWith: sideSchema.nullish(),
  })
  .strict();

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

/**
 * POST /api/review-guide/[documentId] — synthesizes a preparation guide
 * from validated analysis (plus the existing comparison engine when
 * compareWith is provided). Body: { fixtureId, title, version?,
 * compareWith? }. Returns the domain guide plus export-ready Markdown.
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
        message: "Request body must be { fixtureId, title, version?, compareWith? }.",
      },
      { status: 400 },
    );
  }

  // Source resolution happens inside the service; unknown documents
  // surface as 404 unknown-document through aiErrorResponse.
  if (
    body.compareWith !== undefined &&
    body.compareWith !== null &&
    body.compareWith.documentId === documentId
  ) {
    return NextResponse.json(
      {
        code: "same-document",
        message: "Compare against a different document.",
      },
      { status: 400 },
    );
  }

  const service = new PlainTermsReviewGuideService((id) =>
    Promise.resolve({
      documentId: id,
      title: id === documentId ? body.title : (body.compareWith?.title ?? body.title),
      fixtureId:
        id === documentId ? body.fixtureId : (body.compareWith?.fixtureId ?? body.fixtureId),
      version: id === documentId ? body.version : (body.compareWith?.version ?? 1),
      compareWith:
        body.compareWith === undefined || body.compareWith === null
          ? null
          : { ...body.compareWith },
    }),
  );

  try {
    const guide = await service.getReviewGuide(documentId);
    const markdown = await service.renderExport(guide);
    logger.info("Review Guide request served", { documentId, requestId });
    return NextResponse.json({ guide, markdown });
  } catch (error) {
    return aiErrorResponse(error, requestId, { documentId });
  }
}
