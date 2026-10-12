import { Button } from "@/components/ui/button";
import type { Zone } from "@/lib/storage";
import { CITY_PRESETS } from "@/lib/timezones";
import { PRESETS, type Preset } from "@/lib/demoPresets";
import { presetAuthor } from "@/hooks/useTimeDetection";

function PresetCard({ p, hint, active, featured, onPick }: { p: Preset; hint: string | null; active: boolean; featured?: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-disabled={!!hint}
      aria-pressed={active}
      onClick={() => !hint && onPick()}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted motion-reduce:transition-none ${
        active ? "border-primary bg-primary/10" : featured ? "border-primary/50" : ""
      } ${hint ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {p.label}
        {featured && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">Start here</span>}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{p.blurb}</span>
    </button>
  );
}

export function ChatComposer({
  text,
  onTextChange,
  author,
  you,
  participants,
  demoClock,
  onPreset,
  onBackToYou,
  onSend,
}: {
  text: string;
  onTextChange: (text: string) => void;
  author: Zone;
  you: Zone;
  participants: Zone[];
  demoClock: boolean;
  onPreset: (p: Preset, author: Zone) => void;
  onBackToYou: () => void;
  onSend: () => void;
}) {
  const hints = new Set<string>();
  const cards = PRESETS.map((p) => {
    const a = presetAuthor(p, participants, you);
    const hint = !demoClock ? "Presets run on the demo clock." : !a ? `Add ${CITY_PRESETS[p.authorTz!]?.city ?? p.authorTz} on the main page to use this preset.` : null;
    if (hint) hints.add(hint);
    const active = !!a && p.text === text && a.id === author.id;
    return { p, hint, active, pick: () => onPreset(p, a!) };
  });
  const [main, ...more] = cards;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <PresetCard p={main.p} hint={main.hint} active={main.active} featured onPick={main.pick} />
        <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">More cases</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {more.map((c) => (
            <PresetCard key={c.p.id} p={c.p} hint={c.hint} active={c.active} onPick={c.pick} />
          ))}
        </div>
        {[...hints].map((h) => (
          <p key={h} className="text-xs text-muted-foreground">
            {h}
          </p>
        ))}
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="composer" className="text-sm font-medium">
            Sending as {author.city}
            {author.id === you.id && " (you)"}
          </label>
          {author.id !== you.id && (
            <Button type="button" variant="ghost" size="sm" onClick={onBackToYou}>
              Back to you
            </Button>
          )}
        </div>
        {author.id !== you.id && (
          <p className="rounded-md bg-amber-400/15 px-2 py-1 text-xs">This preset is written by your colleague in {author.city}, not by you.</p>
        )}
        <textarea
          id="composer"
          dir="auto"
          rows={3}
          maxLength={500}
          value={text}
          aria-describedby="composer-count"
          placeholder="Type a message with a time, like: Can we meet Thursday at 3pm?"
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <span id="composer-count" className="text-xs text-muted-foreground">
            English or Arabic · {text.length}/500
          </span>
          <Button type="submit" size="sm" disabled={!text.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
