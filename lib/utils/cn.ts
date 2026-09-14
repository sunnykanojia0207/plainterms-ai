/** Tiny class-name joiner. Falsy values are dropped. */
export function cn(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((part) => typeof part === "string" && part !== "").join(" ");
}
