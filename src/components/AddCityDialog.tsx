import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CITY_PRESETS, OOREDOO_TZS, tzCity, worldTimeZones } from "@/lib/timezones";

interface AddCityDialogProps {
  onAdd: (tz: string) => void;
  added: string[];
  disabled?: boolean;
  // Offered on top so people can add their own city right after picking it under "My time zone"
  homeTz?: string | null;
}

export function AddCityDialog({ onAdd, added, disabled, homeTz }: AddCityDialogProps) {
  const [open, setOpen] = useState(false);
  const world = useMemo(() => (open ? worldTimeZones() : []), [open]);
  const button = useRef<HTMLButtonElement>(null);
  const isAdded = (tz: string) => added.includes(tz);

  const pick = (tz: string) => {
    onAdd(tz);
    setOpen(false);
  };

  return (
    <>
      {/* aria-disabled, not disabled, so focus can come back here after the last allowed city is added */}
      <Button ref={button} className="gap-1 aria-disabled:pointer-events-none aria-disabled:opacity-50" onClick={() => !disabled && setOpen(true)} aria-disabled={disabled}>
        <Plus size={16} />
        Add city
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        // Without a Dialog.Trigger Radix has no element to return focus to, so it would land on <body>
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          button.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Add city</DialogTitle>
        <CommandInput placeholder="Search a city or time zone…" />
        <CommandList>
          <CommandEmpty>No time zone found.</CommandEmpty>
          {homeTz && !isAdded(homeTz) && (
            <CommandGroup heading="My time zone">
              <CommandItem value={`my time zone ${homeTz.replace(/_/g, " ")}`} onSelect={() => pick(homeTz)}>
                {CITY_PRESETS[homeTz]?.city ?? tzCity(homeTz)}
                <span className="ml-auto text-xs opacity-70">{homeTz}</span>
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading="Ooredoo markets">
            {OOREDOO_TZS.map((tz) => {
              const { city, country } = CITY_PRESETS[tz];
              return (
                <CommandItem key={tz} value={`ooredoo ${city} ${country} ${tz}`} disabled={isAdded(tz)} onSelect={() => pick(tz)}>
                  {city}
                  <span className="ml-auto text-xs opacity-70">{isAdded(tz) ? "Added" : country}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="All time zones">
            {world.map((tz) => (
              <CommandItem key={tz} value={tz.replace(/_/g, " ")} disabled={isAdded(tz)} onSelect={() => pick(tz)}>
                {tz.replace(/_/g, " ")}
                {isAdded(tz) && <span className="ml-auto text-xs opacity-70">Added</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
