import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { processUploadFile } from "@/lib/documents/ingest";
import { logger } from "@/lib/privacy/log";

const HTTP_STATUS: Record<string, number> = {
  "unsupported-file": 415,
  "too-large": 413,
  "empty-file": 422,
  "unreadable-file": 422,
  "protected-file": 422,
  "no-text": 422,
  "processing-timeout": 504,
  "processing-failed": 502,
};

/**
 * POST /api/documents — thin HTTP adapter over processUploadFile.
 * Multipart field "file" → validated bytes → normalized record.
 * Raw bytes never persist; contents never log.
 */
export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { code: "missing-file", message: "Attach a file as the “file” field." },
      { status: 400 },
    );
  }

  const result = await processUploadFile(
    {
      fileName: file.name || "upload",
      mimeType: file.type,
      sizeBytes: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
    },
    requestId,
  );

  if (!result.ok) {
    if (result.code === "processing-failed") {
      logger.error("Document upload failed unexpectedly", { requestId });
      return NextResponse.json(
        { code: result.code, message: result.message, requestId },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: HTTP_STATUS[result.code] ?? 422 },
    );
  }
  return NextResponse.json({ document: result.document });
}
