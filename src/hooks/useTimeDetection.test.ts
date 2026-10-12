import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { createZone } from "@/lib/storage";
import { useTimeDetection } from "./useTimeDetection";

describe("useTimeDetection presets", () => {
  it("resolves \"your time\" to the only other zone, like the live path", () => {
    const you = createZone("Europe/Prague");
    const { result } = renderHook(() => useTimeDetection([you, createZone("Asia/Qatar")], you, true));
    expect(result.current.detect("3pm your time?", you).expressions[0]).toMatchObject({ kind: "exact", sourceZone: "Asia/Qatar" });
  });
});
