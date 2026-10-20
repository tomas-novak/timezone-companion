import { Globe, Clock, Users } from "lucide-react";

export function Signature({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-sm text-muted-foreground ${className}`}>
      Made with <span role="img" aria-label="AI">🤖</span> and reviewed with <span role="img" aria-label="love">❤️</span> by Tomáš Novák
      <br />
      <a href="mailto:tomas.novak@ofti.app" className="underline underline-offset-4 hover:text-foreground">
        tomas.novak@ofti.app
      </a>
    </p>
  );
}

export function Footer() {
  return (
    <footer className="dark mt-8 border-t bg-brand-footer text-foreground">
      <div className="container py-12">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
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
              This app shows live clocks for the cities you pick with "Add city", including
              quick picks for the Ooredoo markets. Compare hours and the hour difference on each
              card are relative to your time zone, taken from your browser. Change it under
              "My time zone" at the top of the page.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Users size={14} className="text-primary" />
              Working Hours
            </div>
            <p className="text-muted-foreground">
              Each city has its own working hours and days. A card glows when its city is in
              working hours. Use Compare hours to see all cities side by side.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          All preferences are saved locally in your browser.
        </div>
        <Signature className="mt-6" />
      </div>
    </footer>
  );
}
