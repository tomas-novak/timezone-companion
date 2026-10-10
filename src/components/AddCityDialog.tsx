import { useMemo, useState } from "react";
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
  disabled?: boolean;
  // Offered on top so people can add their own city right after picking it under "My timezone"
  homeTz?: string | null;
}

export function AddCityDialog({ onAdd, disabled, homeTz }: AddCityDialogProps) {
  const [open, setOpen] = useState(false);
  const world = useMemo(() => (open ? worldTimeZones() : []), [open]);

  const pick = (tz: string) => {
    onAdd(tz);
    setOpen(false);
  };

  return (
    <>
      <Button className="gap-1" onClick={() => setOpen(true)} disabled={disabled}>
        <Plus size={16} />
        Add city
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Add city</DialogTitle>
        <CommandInput placeholder="Search a city or time zone…" />
        <CommandList>
          <CommandEmpty>No time zone found.</CommandEmpty>
          {homeTz && (
            <CommandGroup heading="My timezone">
              <CommandItem value={`my timezone ${homeTz.replace(/_/g, " ")}`} onSelect={() => pick(homeTz)}>
                {CITY_PRESETS[homeTz]?.city ?? tzCity(homeTz)}
                <span className="ml-auto text-xs opacity-70">{homeTz}</span>
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading="Ooredoo markets">
            {OOREDOO_TZS.map((tz) => {
              const { city, country } = CITY_PRESETS[tz];
              return (
                <CommandItem key={tz} value={`ooredoo ${city} ${country} ${tz}`} onSelect={() => pick(tz)}>
                  {city}
                  <span className="ml-auto text-xs opacity-70">{country}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="All time zones">
            {world.map((tz) => (
              <CommandItem key={tz} value={tz.replace(/_/g, " ")} onSelect={() => pick(tz)}>
                {tz.replace(/_/g, " ")}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
