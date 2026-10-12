import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createZone } from "@/lib/storage";
import { ChatDemo } from "./ChatDemo";

// Vienna shares Prague's offset: a Prague time gives Doha the chip, a Doha time gives Vienna the chip
const zones = [createZone("Europe/Prague"), createZone("Europe/Vienna"), createZone("Asia/Qatar")];
const REPLIES: Record<string, object> = {
  "call at 3pm": { text: "3pm", sourceZone: null, zoneReason: "sender_default" },
  "lunch at 3pm Doha time": { text: "3pm Doha time", sourceZone: "Asia/Qatar", zoneReason: "explicit" },
};

function liveCalls() {
  const pending: (() => void)[] = [];
  vi.stubGlobal("fetch", (_: string, init: RequestInit) => {
    const { message } = JSON.parse(String(init.body));
    const expression = { localDate: null, localTime: "15:00", endLocalTime: null, flag: null, kind: "exact", ...REPLIES[message] };
    return new Promise((resolve) => pending.push(() => resolve({ ok: true, status: 200, json: async () => ({ expressions: [expression] }) })));
  });
  render(
    <TooltipProvider>
      <ChatDemo zones={zones} homeTz="Europe/Prague" use24Hour />
    </TooltipProvider>,
  );
  return pending;
}

const send = (text: string) => {
  fireEvent.change(screen.getByLabelText(/Sending as/), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
};
const reader = () => screen.getAllByRole("radio").find((r) => r.getAttribute("aria-checked") === "true")?.textContent;

describe("ChatDemo reader after live sends", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ["in order", [0, 1]],
    ["out of order", [1, 0]],
  ])("ends on the first reader with a chip for the newest message (%s)", async (_, order) => {
    const pending = liveCalls();
    send("call at 3pm");
    send("lunch at 3pm Doha time");
    for (const i of order) await act(async () => pending[i]());
    expect(reader()).toBe("Vienna");
  });

  it("leaves a reader the user picked while waiting", async () => {
    const pending = liveCalls();
    send("call at 3pm");
    fireEvent.click(screen.getByRole("radio", { name: "Prague" }));
    await act(async () => pending[0]());
    expect(reader()).toBe("Prague");
  });
});
