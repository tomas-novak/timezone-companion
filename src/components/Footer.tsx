import { Globe, Clock, Users } from "lucide-react";
import { TIMEZONE_CONFIGS } from "@/lib/timezones";

export function Footer() {
  return (
    <footer className="border-t bg-card/50 mt-8">
      <div className="container py-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          How it works
        </h3>

        <div className="grid gap-6 md:grid-cols-2 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Clock size={14} className="text-primary" />
              Time Zones
            </div>
            <p className="text-muted-foreground">
              This app displays live clocks for{" "}
              {TIMEZONE_CONFIGS.map((tz) => `${tz.city} (${tz.country})`).join(", ")}. The
              schedule and the hour difference on each card are relative to your home timezone,
              detected from your browser and changeable at the top of the page.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Users size={14} className="text-primary" />
              Working Hours
            </div>
            <p className="text-muted-foreground">
              Each zone has configurable working hours and days. Cards glow when the zone
              is currently within working hours. Use the Schedule View to compare all zones side-by-side.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          All preferences are saved locally in your browser.
        </div>
      </div>
    </footer>
  );
}
