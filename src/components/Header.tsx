import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import logo from "@/assets/logo.png";

interface HeaderProps {
  use24Hour: boolean;
  isDarkMode: boolean;
  onToggle24Hour: () => void;
  onToggleDarkMode: () => void;
}

export function Header({
  use24Hour,
  isDarkMode,
  onToggle24Hour,
  onToggleDarkMode,
}: HeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="OFTI logo" className="h-9 w-9 rounded-lg object-cover" />
          <h1 className="text-lg font-semibold">OFTI time zones</h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* 12h/24h Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!use24Hour ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              12h
            </span>
            <Switch
              checked={use24Hour}
              onCheckedChange={onToggle24Hour}
              aria-label="Toggle 24-hour format"
            />
            <span className={`text-sm ${use24Hour ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              24h
            </span>
          </div>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </div>
    </header>
  );
}
