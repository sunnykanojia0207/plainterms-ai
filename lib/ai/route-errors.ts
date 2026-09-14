/**
 * Shared API error mapping for AI routes. AIError categories become HTTP
 * statuses with safe, user-facing messages (never prompts, keys, or
 * document content). Both analysis and comparison routes use this.
 */
import { NextResponse } from "next/server";
import { AIError } from "@/lib/ai/errors";
import { UnknownDocumentError } from "@/lib/ai/document-content";
import { logger } from "@/lib/privacy/log";

export function aiErrorResponse(
  error: unknown,
  fallbackRequestId: string,
  context?: { readonly leftDocumentId?: string; readonly documentId?: string },
): NextResponse {
  if (error instanceof UnknownDocumentError) {
    return NextResponse.json(
      {
        code: "unknown-document",
        message: "This document is no longer available. Upload it again to continue.",
      },
      { status: 404 },
    );
  }
  if (error instanceof AIError) {
    const status =
      error.category === "unavailable" ? 503 : error.category === "timeout" ? 504 : 502;
    const code =
      error.category === "unavailable"
        ? "ai-unavailable"
        : error.category === "timeout"
          ? "ai-timeout"
          : "ai-error";
    return NextResponse.json(
      { code, message: error.message, requestId: error.requestId },
      { status },
    );
  }
  logger.error("AI request failed unexpectedly", {
    ...(context?.documentId === undefined ? {} : { documentId: context.documentId }),
    ...(context?.leftDocumentId === undefined ? {} : { leftDocumentId: context.leftDocumentId }),
    requestId: fallbackRequestId,
  });
  return NextResponse.json(
    { code: "ai-error", message: "Analysis failed unexpectedly.", requestId: fallbackRequestId },
    { status: 502 },
  );
}
