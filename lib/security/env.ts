/**
 * Server environment validation. All secrets stay server-side:
 * this module MUST only be imported from server code (route handlers,
 * server actions, server components). Importing it in a client
 * component is a build-time error by convention and a runtime throw.
 */
import "server-only";

export interface ServerEnv {
  /** Future Gemini integration key. Optional until the AI milestone. */
  readonly geminiApiKey: string | null;
  readonly appUrl: string;
  readonly nodeEnv: "development" | "production" | "test";
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value === undefined || value === "" ? null : value;
}

/** Validates server env once and returns a frozen snapshot. */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv must only be called on the server.");
  }
  const nodeEnv = readEnv("NODE_ENV");
  return Object.freeze({
    geminiApiKey: readEnv("GEMINI_API_KEY"),
    appUrl: readEnv("APP_URL") ?? "http://localhost:3000",
    nodeEnv: nodeEnv === "production" || nodeEnv === "test" ? nodeEnv : "development",
  });
}
