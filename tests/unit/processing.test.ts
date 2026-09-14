import { describe, expect, it } from "vitest";
import { AbortError, createProcessingDriver, PROCESSING_STAGES } from "@/lib/documents/processing";

describe("processing engine", () => {
  it("reports every stage in order, then completes", async () => {
    const seen: string[] = [];
    await createProcessingDriver(0).run((stage, index) => {
      seen.push(stage.id);
      expect(PROCESSING_STAGES[index]?.id).toBe(stage.id);
    });
    expect(seen).toEqual(PROCESSING_STAGES.map((stage) => stage.id));
    expect(seen).toHaveLength(5);
  });

  it("uses preparation-only wording with no percentages or model claims", () => {
    const copy = PROCESSING_STAGES.map((stage) => stage.label)
      .join(" ")
      .toLowerCase();
    expect(copy).not.toContain("%");
    expect(copy).not.toContain("gemini");
    expect(copy).not.toContain("accuracy");
    for (const stage of PROCESSING_STAGES) {
      expect(stage.announcement.length).toBeGreaterThan(0);
    }
  });

  it("fails deterministically at the final stage with the failure outcome", async () => {
    const seen: string[] = [];
    await expect(
      createProcessingDriver(0).run(
        (stage) => {
          seen.push(stage.id);
        },
        { outcome: "failure" },
      ),
    ).rejects.toThrow("could not be prepared");
    expect(seen).toHaveLength(4);
  });

  it("aborts cleanly with an AbortError", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      createProcessingDriver(0).run(() => {}, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(AbortError);
  });
});
