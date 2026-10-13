import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Zone } from "@/lib/storage";
import { chipFor, type TimeExpression } from "@/lib/timeDetect";
import { NOT_CONVERTED, headline, landingRows } from "@/lib/landing";
import { STATUS_STYLE, TimeChip } from "./TimeChip";

type Who = { cities: Zone[]; author: Zone; viewer: Zone | null; use24Hour: boolean };

export function Headline({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <div className={`space-y-0.5 text-sm font-medium ${className}`}>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );
}

function Times({ e, cities, author, viewer, use24Hour }: Who & { e: TimeExpression }) {
  if (!e.utcInstant) return <p className="text-sm">Not converted: {NOT_CONVERTED[e.flag ?? "not_specific"]}.</p>;
  const rows = landingRows(e, cities, author, viewer, use24Hour);
  return (
    <div className="space-y-3">
      <Headline lines={headline([rows])} />
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.zone.id} className="flex items-center justify-between gap-3">
            <span>
              {r.zone.city}
              {r.role === "you" && <span className="text-muted-foreground"> (You)</span>}
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              <span className="text-muted-foreground">{r.date}</span>
              {r.role === "author" ? <span>Sent as {r.time}</span> : <span>{r.time}</span>}
              {r.status && <span className={STATUS_STYLE[r.status]}>{r.status}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hover opens it for a mouse; a tap, Enter or Space opens it for touch and keyboard; Esc or a click outside closes it
export function TimesPopover({ e, children, ...who }: Who & { e: TimeExpression; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();
  const byHover = useRef(false);
  const returnFocus = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  // The popover is portalled above everything, so in a pinned card it would float over the next card sliding in
  useEffect(() => {
    if (!open) return;
    const close = () => {
      byHover.current = false;
      setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);
  const hover = (next: boolean) => (ev: PointerEvent) => {
    if (ev.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      byHover.current = next;
      if (next) returnFocus.current = false;
      setOpen(next);
    }, next ? 80 : 200);
  };
  const unclear = !e.utcInstant;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) byHover.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          // A click after a hover must not toggle it shut again; a tap or Enter toggles
          onClick={(ev) => {
            ev.preventDefault();
            if (byHover.current) return;
            returnFocus.current = true;
            setOpen((o) => !o);
          }}
          className={`rounded px-0.5 text-foreground underline decoration-dotted underline-offset-4 ${unclear ? "bg-muted" : "bg-primary/20 hover:bg-primary/30"}`}
        >
          {children}
          <span className="sr-only"> (show everyone's time)</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)]"
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(ev) => ev.preventDefault()}
        // Focus handed back after a hover counts as keyboard focus, which scrolls /concept back to a covered card
        onCloseAutoFocus={(ev) => returnFocus.current || ev.preventDefault()}
      >
        <Times e={e} {...who} />
      </PopoverContent>
    </Popover>
  );
}

export function MessageText({ text, expressions, ...who }: Who & { text: string; expressions: TimeExpression[] }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const e of [...expressions].sort((a, b) => a.start - b.start)) {
    if (e.start < cursor) continue;
    parts.push(text.slice(cursor, e.start));
    parts.push(
      <TimesPopover key={e.start} e={e} {...who}>
        {text.slice(e.start, e.end)}
      </TimesPopover>,
    );
    const chip = who.viewer && chipFor(e, who.viewer, who.author.tz, who.use24Hour);
    if (chip) parts.push(<TimeChip key={`${e.start}-chip`} chip={chip} />);
    cursor = e.end;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
