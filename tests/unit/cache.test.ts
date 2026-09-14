import { beforeEach, describe, expect, it } from "vitest";
import { cacheClear, cacheGet, cacheSet, getOrCompute } from "@/lib/ai/cache";

describe("analysis cache", () => {
  beforeEach(() => {
    cacheClear();
  });

  it("returns set values and misses empty keys", () => {
    expect(cacheGet<string>("missing")).toBeNull();
    cacheSet("k", "v");
    expect(cacheGet<string>("k")).toBe("v");
  });

  it("computes once under concurrent callers", async () => {
    let computations = 0;
    const compute = async () => {
      computations += 1;
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      return "result";
    };
    const results = await Promise.all([
      getOrCompute("shared", compute),
      getOrCompute("shared", compute),
      getOrCompute("shared", compute),
    ]);
    expect(results).toEqual(["result", "result", "result"]);
    expect(computations).toBe(1);
  });

  it("does not cache failures", async () => {
    let attempts = 0;
    const failing = async () => {
      attempts += 1;
      throw new Error("boom");
    };
    await expect(getOrCompute("bad", failing)).rejects.toThrow("boom");
    await expect(getOrCompute("bad", failing)).rejects.toThrow("boom");
    expect(attempts).toBe(2);
  });
});
