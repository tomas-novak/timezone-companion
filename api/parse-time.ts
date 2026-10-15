import OpenAI, { APIConnectionTimeoutError } from "openai";
import { EXTRACTION_JSON_SCHEMA, ParseTimeRequest, sanitize } from "../src/lib/extraction.js";
import { SYSTEM_PROMPT, buildCalendar } from "../src/lib/prompt.js";

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
// Luna defaults to "medium" when effort is omitted, so a typo must fall back to "none", not to nothing
const effort = () => EFFORTS.find((e) => e === process.env.OPENAI_REASONING_EFFORT) ?? "none";
// Host only, never the key: shows whether production calls OpenAI or an Azure endpoint, and where
const AI_HOST = process.env.OPENAI_BASE_URL ? URL.parse(process.env.OPENAI_BASE_URL)?.host : "api.openai.com";
let cold = true;
let client: OpenAI | undefined;
const openai = () =>
  (client ??= new OpenAI({ baseURL: process.env.OPENAI_BASE_URL || undefined, timeout: 12000, maxRetries: 0 }));

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function extract(input: ParseTimeRequest) {
  const { message, senderZone, now, teamZones } = input;
  const { data: res, response } = await openai().responses.create({
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: JSON.stringify({ now, senderZone, calendar: buildCalendar(now, senderZone), teamZones, message }),
    text: { format: { type: "json_schema", name: "time_expressions", strict: true, schema: EXTRACTION_JSON_SCHEMA } },
    reasoning: { effort: effort() },
    max_output_tokens: 800,
    store: false,
  }).withResponse();
  // A refusal or cut-off JSON parses to null, which sanitize rejects
  const raw = res.status === "completed" ? parseJson(res.output_text) : null;
  // Time the model itself spent; the rest of ms is network and queueing. Azure may not send it
  const modelMs = Number(response.headers.get("openai-processing-ms")) || undefined;
  return { expressions: sanitize(raw, message, senderZone, teamZones), usage: res.usage, modelMs };
}

export async function POST(req: Request): Promise<Response> {
  if (req.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const text = await req.text();
  if (text.length > 8192) return new Response(null, { status: 413 });
  const body = ParseTimeRequest.safeParse(parseJson(text));
  if (!body.success) return new Response(null, { status: 400 });
  const t0 = Date.now();
  const wasCold = cold;
  cold = false;
  // Metrics only: never the message or the model output
  const log = (fields: object) =>
    console.info(
      JSON.stringify({ model: MODEL, effort: effort(), host: AI_HOST, region: process.env.VERCEL_REGION, cold: wasCold, ms: Date.now() - t0, ...fields }),
    );
  try {
    const { expressions, usage, modelMs } = await extract(body.data);
    log({
      modelMs,
      inTok: usage?.input_tokens,
      cachedTok: usage?.input_tokens_details?.cached_tokens,
      outTok: usage?.output_tokens,
      reasonTok: usage?.output_tokens_details?.reasoning_tokens,
      n: expressions?.length ?? "invalid",
    });
    if (!expressions) return new Response(null, { status: 502 });
    return Response.json({ expressions }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const timedOut = err instanceof APIConnectionTimeoutError;
    log({ error: timedOut ? "timeout" : ((err as { status?: number }).status ?? "network") });
    return new Response(null, { status: timedOut ? 504 : 502 });
  }
}
