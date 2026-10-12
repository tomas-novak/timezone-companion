import { describe, expect, it } from "vitest";
import { debouncedSave, getDefaultSettings, loadSettings } from "./storage";

describe("loadSettings", () => {
  it("sees a save that is still debounced", () => {
    const settings = { ...getDefaultSettings(), use24Hour: false };
    debouncedSave(settings);
    expect(loadSettings().use24Hour).toBe(false);
  });
});
