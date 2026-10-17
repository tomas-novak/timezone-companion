import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateTime, Settings } from "luxon";
import { createZone } from "@/lib/storage";
import { AddCityDialog } from "./AddCityDialog";
import { ClockCard } from "./ClockCard";

const originalScroll = Element.prototype.scrollIntoView;

describe("home screen", () => {
  afterEach(() => {
    Element.prototype.scrollIntoView = originalScroll;
    cleanup();
    vi.unstubAllGlobals();
    Settings.defaultZone = "system";
    Settings.now = () => Date.now();
  });

  it("shows the working week on a city card, unshifted by a DST jump in the viewer's zone", () => {
    Settings.defaultZone = "Europe/Prague";
    Settings.now = () => Date.parse("2026-03-29T01:30:00Z");
    const doha = { ...createZone("Asia/Qatar"), workingStart: "02:00" };
    render(<ClockCard zone={doha} now={DateTime.now()} use24Hour homeTz="Europe/Prague" />);
    expect(screen.getByText("Sun–Thu · 02:00–17:00")).toBeTruthy();
  });

  it("marks added cities, ignores picks on them, and returns focus to Add city", async () => {
    // cmdk measures its list; jsdom has neither API
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    Element.prototype.scrollIntoView = () => {};
    const picks: string[] = [];
    render(<AddCityDialog onAdd={(tz) => picks.push(tz)} added={["Asia/Qatar"]} />);
    const button = screen.getByRole("button", { name: "Add city" });
    await act(async () => fireEvent.click(button));
    const doha = screen.getByRole("option", { name: /Doha/ });
    expect(doha.getAttribute("aria-disabled")).toBe("true");
    expect(doha.textContent).toContain("Added");
    await act(async () => fireEvent.click(doha));
    expect(picks).toEqual([]);
    await act(async () => fireEvent.click(screen.getAllByRole("option", { name: /Muscat/ })[0]));
    expect(picks).toEqual(["Asia/Muscat"]);
    expect(document.activeElement).toBe(button);
  });
});
