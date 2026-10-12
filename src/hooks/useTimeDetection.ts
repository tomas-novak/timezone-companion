import { useCallback } from "react";
import { DateTime } from "luxon";
import type { Zone } from "@/lib/storage";
import { sanitize, type ParseTimeRequest } from "@/lib/extraction";
import { TIME_HINT } from "@/lib/timeHint";
import { DEMO_NOW, PRESETS, fixtureFor, type Preset } from "@/lib/demoPresets";
import { callParseTime, teamZonesFor, toExpressions, type DetectionResult } from "@/lib/timeDetect";

export const presetAuthor = (p: Preset, participants: Zone[], you: Zone) =>
  p.authorTz === null ? you : participants.find((z) => z.tz === p.authorTz);

const empty = { source: null, request: null, response: null, expressions: [] };

export function useTimeDetection(participants: Zone[], you: Zone, demoClock: boolean) {
  const nowIso = useCallback(() => (demoClock ? DEMO_NOW : new Date().toISOString()), [demoClock]);

  const detect = useCallback(
    (text: string, author: Zone): DetectionResult => {
      const now = nowIso();
      if (!TIME_HINT.test(text)) return { ...empty, status: "no-candidate" };
      const request: ParseTimeRequest = {
        message: text,
        senderZone: author.tz,
        now: DateTime.fromISO(now).setZone(author.tz).toISO()!,
        teamZones: teamZonesFor(participants),
      };
      const preset = demoClock && PRESETS.find((p) => p.text === text && presetAuthor(p, participants, you)?.id === author.id);
      if (!preset) return { ...empty, status: "ready", request };
      const response = fixtureFor(preset.id);
      const exprs = sanitize(response, text, author.tz, request.teamZones);
      if (!exprs) return { ...empty, status: "error", source: "cache", request, response };
      return { status: "done", source: "cache", request, response, expressions: toExpressions(exprs, text, now) };
    },
    [participants, you, demoClock, nowIso],
  );

  // One AI call per sent message: drafts never reach the API
  const send = useCallback(
    (text: string, author: Zone): { initial: DetectionResult; later?: Promise<DetectionResult> } => {
      const r = detect(text, author);
      if (r.status !== "ready") return { initial: r };
      const request = r.request!;
      const live = { ...r, source: "live" as const };
      const later = callParseTime(request).then(
        (exprs): DetectionResult => ({ ...live, status: "done", response: { expressions: exprs }, expressions: toExpressions(exprs, text, request.now) }),
        (): DetectionResult => ({ ...live, status: "error" }),
      );
      return { initial: { ...live, status: "pending" }, later };
    },
    [detect],
  );

  return { detect, send, nowIso };
}
