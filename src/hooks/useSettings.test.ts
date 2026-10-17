import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { flushSave } from "@/lib/storage";
import { useSettings } from "./useSettings";

describe("useSettings", () => {
  afterEach(() => {
    flushSave();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("does not add a city that is already on the list", () => {
    const { result } = renderHook(() => useSettings());
    const before = result.current.settings.zones.length;
    act(() => result.current.addZone("Asia/Qatar"));
    act(() => result.current.addZone("Asia/Jakarta"));
    act(() => result.current.addZone("Asia/Jakarta"));
    expect(result.current.settings.zones.map((z) => z.tz).filter((tz) => tz === "Asia/Jakarta")).toHaveLength(1);
    expect(result.current.settings.zones).toHaveLength(before + 1);
  });
});
