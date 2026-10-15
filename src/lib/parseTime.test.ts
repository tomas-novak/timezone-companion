// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { create, Timeout } = vi.hoisted(() => ({ create: vi.fn(), Timeout: class extends Error {} }));
// Like the SDK's APIPromise: awaitable, plus withResponse() for the headers
const apiPromise = (...args: unknown[]) => {
  const data = Promise.resolve().then(() => create(...args));
  const headers = { "openai-processing-ms": "1234" };
  return Object.assign(data, { withResponse: async () => ({ data: await data, response: new Response(null, { headers }), request_id: null }) });
};
vi.mock("openai", () => ({ default: class { responses = { create: apiPromise }; }, APIConnectionTimeoutError: Timeout }));

import { POST } from "../../api/parse-time";

const body = {
  message: "Can we meet Thursday at 3pm?",
  senderZone: "Europe/Prague",
  now: "2026-10-13T10:00:00.000+02:00",
  teamZones: { Prague: "Europe/Prague", Doha: "Asia/Qatar" },
};
const post = (text: string, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost/api/parse-time", { method: "POST", headers, body: text }));
const modelSays = (output: object) => create.mockResolvedValue({ status: "completed", output_text: JSON.stringify(output), usage: {} });

describe("POST /api/parse-time", () => {
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    create.mockReset();
    log = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    log.mockRestore();
    vi.unstubAllEnvs();
  });

  it("rejects cross-site calls, oversized bodies and invalid requests without calling the model", async () => {
    expect((await post(JSON.stringify(body), { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await post("x".repeat(8193))).status).toBe(413);
    expect((await post("{not json")).status).toBe(400);
    expect((await post(JSON.stringify({ ...body, extra: 1 }))).status).toBe(400);
    expect((await post(JSON.stringify({ ...body, message: "a".repeat(501) }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns sanitized expressions and sends the agreed model settings", async () => {
    modelSays({
      expressions: [
        { text: "Thursday at 3pm", localDate: "2026-10-15", localTime: "15:00", endLocalTime: null, sourceZone: null, zoneReason: "sender_default", flag: null, kind: "exact" },
        { text: "not in the message", localDate: null, localTime: "09:00", endLocalTime: null, sourceZone: null, zoneReason: "sender_default", flag: null, kind: "exact" },
      ],
    });
    const res = await post(JSON.stringify(body));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).expressions).toEqual([expect.objectContaining({ text: "Thursday at 3pm", sourceZone: "Europe/Prague" })]);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-6-luna", reasoning: { effort: "none" }, store: false, max_output_tokens: 800 }));
  });

  it("takes the reasoning effort from OPENAI_REASONING_EFFORT and falls back to none on an unknown value", async () => {
    modelSays({ expressions: [] });
    for (const [value, sent] of [["low", "low"], ["hihg", "none"]]) {
      vi.stubEnv("OPENAI_REASONING_EFFORT", value);
      await post(JSON.stringify(body));
      expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ reasoning: { effort: sent } }));
    }
    vi.unstubAllEnvs();
  });

  it("answers 502 when the model output is unusable or the call fails", async () => {
    modelSays({ nope: true });
    expect((await post(JSON.stringify(body))).status).toBe(502);
    create.mockResolvedValue({ status: "incomplete", output_text: "{", usage: {} });
    expect((await post(JSON.stringify(body))).status).toBe(502);
    create.mockRejectedValue(Object.assign(new Error("bad gateway"), { status: 500 }));
    expect((await post(JSON.stringify(body))).status).toBe(502);
  });

  it("answers 504 when the model call times out", async () => {
    create.mockRejectedValue(new Timeout());
    expect((await post(JSON.stringify(body))).status).toBe(504);
  });

  it("logs metrics only, never the message", async () => {
    modelSays({ expressions: [] });
    await post(JSON.stringify(body));
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain('"model"');
    expect(logged).not.toContain("Thursday");
  });

  it("logs what explains slowness: cold start, model time, effort, host and region", async () => {
    vi.stubEnv("OPENAI_BASE_URL", "");
    vi.stubEnv("OPENAI_REASONING_EFFORT", "none");
    vi.stubEnv("VERCEL_REGION", "fra1");
    vi.resetModules();
    const { POST: fresh } = await import("../../api/parse-time");
    modelSays({ expressions: [] });
    const call = () => fresh(new Request("http://localhost/api/parse-time", { method: "POST", body: JSON.stringify(body) }));
    await call();
    await call();
    const [first, second] = log.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(first).toMatchObject({ cold: true, modelMs: 1234, effort: "none", host: "api.openai.com", region: "fra1" });
    expect(second.cold).toBe(false);
  });
});
