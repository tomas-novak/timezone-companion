import { useMemo, useRef, useState, type ReactNode } from "react";
import { DateTime } from "luxon";
import { Switch } from "@/components/ui/switch";
import { createZone, newId, type Zone } from "@/lib/storage";
import { MAX_ZONES, canonicalTz, resolveHomeTz } from "@/lib/timezones";
import { DEMO_NOW } from "@/lib/demoPresets";
import { firstReaderWithChip, type ChatMessage } from "@/lib/timeDetect";
import { useTimeDetection } from "@/hooks/useTimeDetection";
import { ChatComposer } from "./ChatComposer";
import { SenderPreview } from "./SenderPreview";
import { ChatThread } from "./ChatThread";
import { UnderTheHood } from "./UnderTheHood";

function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </span>
      <div>
        <h3 className="font-semibold">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h3>
        {children && <p className="text-sm text-muted-foreground">{children}</p>}
      </div>
    </div>
  );
}

export function ChatDemo({ zones, homeTz, use24Hour }: { zones: Zone[]; homeTz: string | null; use24Hour: boolean }) {
  const { participants, you } = useMemo(() => {
    const home = canonicalTz(resolveHomeTz(homeTz));
    const team = zones.slice(0, MAX_ZONES);
    const found = team.find((z) => canonicalTz(z.tz) === home);
    const you = found ?? createZone(home, "home");
    return { participants: found ? team : [you, ...team], you };
  }, [zones, homeTz]);

  const [demoClock, setDemoClock] = useState(true);
  const [text, setText] = useState("");
  // null follows "you", so changing My time zone moves the composer and the reader with it
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Only the newest sent message may still move the reader, and only until the user picks one
  const autoPickFor = useRef<string | null>(null);
  const { detect, send, nowIso } = useTimeDetection(participants, you, demoClock);

  const byId = (id: string | null) => participants.find((z) => z.id === id);
  const author = byId(authorId) ?? you;
  const viewer = byId(viewerId) ?? you;
  const draft = useMemo(() => (text.trim() ? detect(text, author) : null), [text, author, detect]);

  const onSend = () => {
    if (!text.trim()) return;
    const id = newId();
    const { initial, later } = send(text, author);
    setMessages((prev) => [...prev, { id, authorZoneId: author.id, text, createdAt: nowIso(), detection: initial }]);
    autoPickFor.current = id;
    setViewerId(firstReaderWithChip(initial.expressions, author, participants, use24Hour)?.id ?? null);
    later?.then((detection) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, detection } : m)));
      if (autoPickFor.current === id) setViewerId(firstReaderWithChip(detection.expressions, author, participants, use24Hour)?.id ?? null);
    });
    setText("");
    setAuthorId(null);
  };

  const newest = messages[messages.length - 1];
  const hoodDetection = text.trim() ? draft : (newest?.detection ?? null);
  const hoodAuthor = text.trim() ? author : (byId(newest?.authorZoneId ?? null) ?? you);

  const clock = `${DateTime.fromISO(DEMO_NOW).setZone(you.tz).toFormat("ccc d LLL, HH:mm", { locale: "en" })} ${you.city}`;

  return (
    <>
      <section id="demo" className="scroll-mt-20 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Try it</h2>
          <p className="text-muted-foreground">
            Three steps, about a minute. You are a team member in {you.city}; your colleagues are in the cities below. Your city follows
            "My time zone" at the top, which starts from your browser's time zone.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-6 rounded-xl border bg-card p-4 lg:col-span-5">
            <div className="space-y-3">
              <Step n={1} title="Pick a message, or write your own" />
              <ChatComposer
                text={text}
                onTextChange={setText}
                author={author}
                you={you}
                participants={participants}
                demoClock={demoClock}
                onPreset={(p, a) => {
                  setText(p.text);
                  setAuthorId(a.id);
                }}
                onBackToYou={() => setAuthorId(null)}
                onSend={onSend}
              />
            </div>
            <div className="space-y-3">
              <Step n={2} title="Check it before sending">
                {text.trim() ? "Before you press Send, see what the time means for each colleague." : "Pick a message above and the preview appears here."}
              </Step>
              {text.trim() && <SenderPreview text={text} detection={draft} author={author} participants={participants} use24Hour={use24Hour} />}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-4 lg:col-span-7">
            <Step n={3} title="Read it as someone else">
              {messages.length ? (
                <>
                  Now reading as <b className="text-foreground">{viewer.city}</b>. Switch readers: each one sees the time in their own zone.{" "}
                  <a href="#how" className="underline underline-offset-2">
                    See what the AI received
                  </a>
                </>
              ) : (
                "Send a message, then switch who is reading."
              )}
            </Step>
            <ChatThread messages={messages} participants={participants} you={you} viewer={viewer} onViewerChange={(v) => {
                autoPickFor.current = null;
                setViewerId(v);
              }} use24Hour={use24Hour} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {demoClock
            ? `The demo runs on a fixed clock (${clock}), so the results match the video.`
            : "Demo clock is off: custom messages use the real time and presets are paused."}
        </p>
      </section>

      <section id="how" className="scroll-mt-20 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">What just happened</h2>
          <p className="text-muted-foreground">The steps behind the last message, and exactly what the AI gets.</p>
        </div>
        <UnderTheHood detection={hoodDetection} readers={participants.filter((z) => z.id !== hoodAuthor.id).length} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={demoClock} onCheckedChange={setDemoClock} />
          Demo clock ({clock})
        </label>
      </section>
    </>
  );
}
