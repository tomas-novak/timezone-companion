import { Globe, Clock, Users } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card/50 mt-8">
      <div className="container py-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          How it works
        </h3>

        <div className="grid gap-6 md:grid-cols-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Clock size={14} className="text-primary" />
              Time Zones
            </div>
            <p className="text-muted-foreground">
              This app displays live clocks for Tunis (Tunisia), Prague (Czech Republic),
              Muscat (Oman), and Doha (Qatar).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Users size={14} className="text-primary" />
              Working Hours
            </div>
            <p className="text-muted-foreground">
              Each zone has configurable working hours and days. Cards glow when the zone
              is currently within working hours.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Globe size={14} className="text-primary" />
              Reasonable Hours & Overlap
            </div>
            <p className="text-muted-foreground">
              "Reasonable hours" define when people are typically available (default 08:00–19:00).
              The overlap finder locates the next window when all 4 zones are within their
              reasonable hours.
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
