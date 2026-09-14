import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { PlainTermsComparisonService } from "@/lib/ai/comparison-service";
import { aiErrorResponse } from "@/lib/ai/route-errors";

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
    left: sideSchema,
    right: sideSchema,
  })
  .strict();

/**
 * POST /api/compare — semantic comparison of two fixture-backed documents.
 * Body: { left: { documentId, fixtureId, title, version? }, right: {...} }.
 * Deterministic alignment runs first; only differing sections reach Gemini.
 * Returns validated domain objects with dual-version evidence.
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
        message: "Request body must be { left, right } document descriptors.",
      },
      { status: 400 },
    );
  }

  // Source resolution happens inside the service; unknown documents
  // surface as 404 unknown-document through aiErrorResponse.
  if (body.left.documentId === body.right.documentId) {
    return NextResponse.json(
      {
        code: "same-document",
        message: "Choose two different documents to compare.",
      },
      { status: 400 },
    );
  }

  const byId = new Map([
    [body.left.documentId, body.left],
    [body.right.documentId, body.right],
  ]);
  const service = new PlainTermsComparisonService((id) => {
    const side = byId.get(id);
    if (side === undefined) {
      return Promise.reject(new Error(`Unknown document: ${id}.`));
    }
    return Promise.resolve({
      documentId: side.documentId,
      title: side.title,
      fixtureId: side.fixtureId,
      version: side.version,
    });
  });

  try {
    const comparison = await service.compareVersions(body.left.documentId, body.right.documentId);
    return NextResponse.json(comparison);
  } catch (error) {
    return aiErrorResponse(error, requestId, {
      leftDocumentId: body.left.documentId,
    });
  }
}
