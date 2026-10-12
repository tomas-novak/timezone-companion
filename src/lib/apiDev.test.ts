// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

const body = JSON.stringify({
  message: "call at 3pm",
  senderZone: "Europe/Prague",
  now: "2026-10-13T10:00:00.000+02:00",
  teamZones: { Prague: "Europe/Prague" },
});

describe("apiDev middleware", () => {
  let server: ViteDevServer;
  let url: string;
  beforeAll(async () => {
    // An empty key wins over .env.local, so a broken guard can never make a paid call
    process.env.OPENAI_API_KEY = "";
    server = await createServer({ configFile: "vite.config.ts", mode: "test", logLevel: "silent", server: { port: 0, host: "127.0.0.1" } });
    await server.listen();
    const address = server.httpServer!.address();
    url = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/api/parse-time`;
  }, 30_000);
  afterAll(() => server?.close());

  it("keeps the cross-site guard in dev", async () => {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "text/plain", "sec-fetch-site": "cross-site" }, body });
    expect(res.status).toBe(403);
    // The first request compiles api/parse-time.ts and openai, which can pass 5 s while other suites run
  }, 30_000);
});
