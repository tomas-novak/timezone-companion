import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { youFor } from "@/lib/demoPresets";
import { createZone, type Zone } from "@/lib/storage";
import { ParseTimeRequest } from "@/lib/extraction";
import { TryIt } from "./TryIt";

const prague = youFor("Europe/Prague");
const at3pm = (message: string) => {
  const start = message.indexOf("3pm");
  return start < 0 ? [] : [{ text: "3pm", localDate: null, localTime: "15:00", endLocalTime: null, sourceZone: null, zoneReason: "sender_default", flag: null, kind: "exact" }];
};

function setup({ you, cities }: { you: Zone; cities: Zone[] } = prague, fail: false | number = false) {
  const fetch = vi.fn(async (_: string, init: RequestInit) => {
    const { message } = ParseTimeRequest.parse(JSON.parse(String(init.body)));
    if (fail) return { ok: false, status: fail, json: async () => null };
    return { ok: true, status: 200, json: async () => ({ expressions: at3pm(message) }) };
  });
  vi.stubGlobal("fetch", fetch);
  render(<TryIt you={you} cities={cities} use24Hour />);
  return fetch;
}
const type = (text: string) => fireEvent.change(screen.getByLabelText(/Sending from/), { target: { value: text } });
const click = (name: string, role = "button") => act(async () => fireEvent.click(screen.getByRole(role, { name })));
const status = () => screen.getByRole("status").textContent;

describe("TryIt", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("says no time found without calling the AI, and when the AI finds none", async () => {
    const fetch = setup();
    type("thanks, looks good");
    await click("Check before sending");
    expect(status()).toContain("No time found");
    expect(fetch).not.toHaveBeenCalled();
    type("see you tomorrow");
    await click("Check before sending");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(status()).toContain("No time found");
  });

  it("one check shows both moments: the sender's result and the chat to read as others", async () => {
    const fetch = setup();
    type(" call at 3pm ");
    await click("Check before sending");
    expect(status()).toMatch(/AI read it as .* 15:00 Prague time/);
    expect(screen.getByRole("log").textContent).toContain("your time");
    await click("Doha", "radio");
    await click("New Delhi", "radio");
    expect(screen.getByRole("radio", { name: "New Delhi" }).getAttribute("aria-checked")).toBe("true");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("caches by text: an edit checks again, editing back calls nothing", async () => {
    const fetch = setup();
    type("call at 3pm");
    await click("Check before sending");
    type("call at 3pm today");
    await click("Check before sending");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("log").textContent).toContain("today");
    type("call at 3pm");
    await click("Check before sending");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(status()).toMatch(/AI read it as/);
    expect(screen.getByRole("log").textContent).not.toContain("today");
  });

  it("shows the proof line for a sixth home city", async () => {
    const you = createZone("Asia/Jakarta", "you");
    setup({ you, cities: [...prague.cities, you] });
    type("call at 3pm");
    await click("Check before sending");
    expect(status()).toMatch(/AI read it as .* 15:00 Jakarta time/);
  });

  it("offers a retry that makes exactly one more call", async () => {
    const fetch = setup(prague, 502);
    type("call at 3pm");
    await click("Check before sending");
    expect(status()).toContain("The AI didn't answer.");
    await click("Try again");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("asks to wait on a rate limit and offers no instant retry", async () => {
    setup(prague, 429);
    type("call at 3pm");
    await click("Check before sending");
    expect(status()).toContain("Too many tries from your network. Wait a minute, then try again.");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("scrolls the chat into view after a check, but not for a late answer to an edited draft", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    let answer!: (r: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((r) => (answer = r))));
    render(<TryIt you={prague.you} cities={prague.cities} use24Hour />);
    const reply = { ok: true, status: 200, json: async () => ({ expressions: at3pm("3pm") }) };
    type("call at 3pm");
    await click("Check before sending");
    type("call at 3pm today");
    await act(async () => answer(reply));
    expect(scroll).not.toHaveBeenCalled();
    await click("Check before sending");
    await act(async () => answer(reply));
    expect(scroll).toHaveBeenCalledWith({ block: "nearest" });
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("checks on Enter but not on Shift+Enter", async () => {
    const fetch = setup();
    type("call at 3pm");
    const box = screen.getByLabelText(/Sending from/);
    // fireEvent returns false when the handler prevented the default (the newline)
    expect(fireEvent.keyDown(box, { key: "Enter", shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(box, { key: "Enter", isComposing: true })).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    let notPrevented = true;
    await act(async () => {
      notPrevented = fireEvent.keyDown(box, { key: "Enter" });
    });
    expect(notPrevented).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("says when the AI timed out", async () => {
    setup(prague, 504);
    type("call at 3pm");
    await click("Check before sending");
    expect(status()).toContain("Timeout: the AI took too long to answer.");
  });

  it("makes one call on a double click", async () => {
    const fetch = setup();
    type("call at 3pm");
    await act(async () => {
      const b = screen.getByRole("button", { name: "Check before sending" });
      fireEvent.click(b);
      fireEvent.click(b);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("re-checks the same text after the home city changes", async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ expressions: at3pm("3pm") }) }));
    vi.stubGlobal("fetch", fetch);
    const { rerender } = render(<TryIt you={prague.you} cities={prague.cities} use24Hour />);
    type("call at 3pm");
    await click("Check before sending");
    const doha = youFor("Asia/Qatar");
    rerender(<TryIt you={doha.you} cities={doha.cities} use24Hour />);
    expect(status()).not.toContain("Prague time");
    await click("Check before sending");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(status()).toContain("Doha time");
  });

  it("says the AI is slower than usual only after 10 s of waiting", async () => {
    vi.useFakeTimers();
    let answer!: (r: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((r) => (answer = r))));
    render(<TryIt you={prague.you} cities={prague.cities} use24Hour />);
    type("call at 3pm");
    await click("Check before sending");
    expect(status()).toContain("Asking the AI");
    await act(async () => vi.advanceTimersByTime(9_900));
    expect(status()).not.toContain("slower than usual");
    await act(async () => vi.advanceTimersByTime(200));
    expect(status()).toContain("slower than usual");
    await act(async () => answer({ ok: true, status: 200, json: async () => ({ expressions: at3pm("call at 3pm") }) }));
    expect(status()).not.toContain("slower than usual");
    expect(status()).toMatch(/AI read it as/);
  });
});
