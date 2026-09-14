import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { PlainTermsActionPackService } from "@/lib/ai/action-pack-service";
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
 * POST /api/action-pack/[documentId] — builds the preparation pack from
 * validated analysis. Body: { fixtureId, title, version? }. Returns the
 * domain pack plus export-ready Markdown rendered from the same bundle.
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
  const service = new PlainTermsActionPackService((id) =>
    Promise.resolve({
      documentId: id,
      title: body.title,
      fixtureId: body.fixtureId,
      version: body.version,
    }),
  );

  try {
    const pack = await service.getActionPack(documentId);
    const markdown = await service.renderExport(pack, "markdown");
    logger.info("Action Pack request served", { documentId, requestId });
    return NextResponse.json({ pack, markdown });
  } catch (error) {
    return aiErrorResponse(error, requestId, { documentId });
  }
}
