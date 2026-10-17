import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEMO_CITIES, EXAMPLES, type Example } from "@/lib/demoPresets";
import { MomentWrite } from "./MomentWrite";
import { MomentRead } from "./MomentRead";

const thursday = EXAMPLES.find((x) => x.id === "exact")!;
const arabic = EXAMPLES.find((x) => x.id === "arabic")!;
const friday = EXAMPLES.find((x) => x.id === "friday")!;
const city = (tz: string) => DEMO_CITIES.find((z) => z.tz === tz)!;
const doha = city("Asia/Qatar");
const reader = () => within(screen.getByRole("group", { name: "Read as" })).getAllByRole("radio").find((r) => r.getAttribute("aria-checked") === "true")?.textContent;
const renderRead = (example: Example) =>
  render(
    <TooltipProvider>
      <MomentRead example={example} onExampleChange={() => {}} use24Hour />
    </TooltipProvider>,
  );
// jsdom has no PointerEvent, and React derives onPointerEnter/Leave from pointerover/pointerout
const mouse = (type: "pointerover" | "pointerout", relatedTarget: Element | null) => {
  const e = new MouseEvent(type, { bubbles: true, relatedTarget });
  Object.defineProperty(e, "pointerType", { value: "mouse" });
  return e;
};
const fetchSpy = vi.fn(() => {
  throw new Error("no network in the story sections");
});

describe("Moments", () => {
  beforeEach(() => vi.stubGlobal("fetch", fetchSpy));
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("checks the draft on Send and sends anyway", () => {
    const onSent = vi.fn();
    render(
      <TooltipProvider>
        <MomentWrite example={thursday} onExampleChange={() => {}} onSent={onSent} use24Hour />
      </TooltipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const check = screen.getByRole("alertdialog");
    expect(check).toHaveTextContent("Late in the day for 2 cities: Muscat, New Delhi");
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Send anyway" }));
    expect(onSent).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("a tap on the time opens the popup and a second tap closes it", () => {
    render(
      <TooltipProvider>
        <MomentWrite example={thursday} onExampleChange={() => {}} onSent={() => {}} use24Hour />
      </TooltipProvider>,
    );
    const time = screen.getByRole("button", { name: /Thursday at 3pm/ });
    fireEvent.click(time);
    expect(time).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toHaveTextContent("New Delhi");
    fireEvent.click(time);
    expect(time).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the popup when the page scrolls", () => {
    render(
      <TooltipProvider>
        <MomentWrite example={thursday} onExampleChange={() => {}} onSent={() => {}} use24Hour />
      </TooltipProvider>,
    );
    const time = screen.getByRole("button", { name: /Thursday at 3pm/ });
    fireEvent.click(time);
    expect(time).toHaveAttribute("aria-expanded", "true");
    fireEvent.scroll(window);
    expect(time).toHaveAttribute("aria-expanded", "false");
  });

  it("a hover popup does not hand focus to the time when it closes", () => {
    vi.useFakeTimers();
    try {
      render(
        <TooltipProvider>
          <MomentWrite example={thursday} onExampleChange={() => {}} onSent={() => {}} use24Hour />
        </TooltipProvider>,
      );
      const time = screen.getByRole("button", { name: /Thursday at 3pm/ });
      fireEvent(time, mouse("pointerover", null));
      act(() => vi.advanceTimersByTime(100));
      expect(time).toHaveAttribute("aria-expanded", "true");
      fireEvent(time, mouse("pointerout", document.body));
      act(() => vi.advanceTimersByTime(300));
      // Radix hands focus back in a timeout after the close renders
      act(() => vi.runAllTimers());
      expect(time).toHaveAttribute("aria-expanded", "false");
      expect(time).not.toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns focus to Send after Edit", async () => {
    render(
      <TooltipProvider>
        <MomentWrite example={thursday} onExampleChange={() => {}} onSent={() => {}} use24Hour />
      </TooltipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toHaveFocus());
  });

  it.each([
    ["Thursday 3pm: late in Muscat", thursday, "Muscat"],
    ["Sunday in Arabic: weekend in Tunis first", arabic, "Tunis"],
    ["Friday 11am: weekend in Muscat", friday, "Muscat"],
  ])("starts on the reader with the worst status: %s", (_, example, expected) => {
    renderRead(example);
    expect(reader()).toBe(expected);
  });

  it("shows each reader their own time", () => {
    renderRead(thursday);
    fireEvent.click(screen.getByRole("radio", { name: "Doha" }));
    expect(screen.getByRole("log")).toHaveTextContent("→ 16:00 your time");
    fireEvent.click(screen.getByRole("radio", { name: "Muscat" }));
    expect(screen.getByRole("log")).toHaveTextContent("→ 17:00 your time");
  });

  it("gives every reader the same neutral chip, without naming the status", () => {
    renderRead(thursday);
    const chip = () => within(screen.getByRole("log")).getByText(/your time/);
    fireEvent.click(screen.getByRole("radio", { name: "Doha" }));
    const working = chip().className;
    fireEvent.click(screen.getByRole("radio", { name: "New Delhi" }));
    expect(chip()).toHaveTextContent("→ 18:30 your time");
    expect(chip().className).toBe(working);
    expect(chip()).not.toHaveTextContent("Late");
  });
});
