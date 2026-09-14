import { NextResponse, type NextRequest } from "next/server";
import { deleteRecord } from "@/lib/documents/records";
import { logger } from "@/lib/privacy/log";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

/** DELETE /api/documents/[documentId] — drops the parsed record. Metadata only in logs. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  if (!/^[A-Za-z0-9-]{8,64}$/.test(documentId)) {
    return NextResponse.json(
      { code: "bad-request", message: "Invalid document id." },
      { status: 400 },
    );
  }
  deleteRecord(documentId);
  logger.info("Document record deleted", { documentId });
  return NextResponse.json({ deleted: true });
}
