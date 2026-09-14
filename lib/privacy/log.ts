/**
 * Privacy-safe logger. The FIRST rule of PlainTerms logging:
 * never log document content, AI response content, prompts, or PII.
 *
 * Context is restricted to primitives (string | number | boolean) so a
 * clause object or answer can never slip into a log line by accident.
 * Keys resembling content are stripped defensively.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean>;

const SENSITIVE_KEY_PATTERN =
  /content|text|document|prompt|answer|clause|quote|email|name|address|token|key|secret|password/i;

const MAX_STRING_LENGTH = 200;

function sanitizeContext(context: LogContext | undefined): LogContext {
  if (context === undefined) {
    return {};
  }
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }
    clean[key] =
      typeof value === "string" && value.length > MAX_STRING_LENGTH
        ? `${value.slice(0, MAX_STRING_LENGTH)}…`
        : value;
  }
  return clean;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const payload = {
    level,
    message,
    ...sanitizeContext(context),
    timestamp: new Date().toISOString(),
  };
  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      emit("debug", message, context);
    }
  },
  info(message: string, context?: LogContext): void {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    emit("error", message, context);
  },
};
