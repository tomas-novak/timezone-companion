import { Header } from "@/components/Header";
import { ClockCard } from "@/components/ClockCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { MeetingOverlap } from "@/components/MeetingOverlap";
import { Footer } from "@/components/Footer";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useSettings } from "@/hooks/useSettings";
import { TIMEZONE_CONFIGS } from "@/lib/timezones";

const Index = () => {
  const now = useLiveClock();
  const { settings, toggle24Hour, toggleDarkMode, updateZoneSettings } = useSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        use24Hour={settings.use24Hour}
        isDarkMode={settings.isDarkMode}
        onToggle24Hour={toggle24Hour}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 container py-6 space-y-6">
        {/* Clock Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {TIMEZONE_CONFIGS.map((config) => (
            <ClockCard
              key={config.id}
              config={config}
              settings={settings.zones[config.id]}
              now={now}
              use24Hour={settings.use24Hour}
            />
          ))}
        </div>

        {/* Meeting Overlap */}
        <MeetingOverlap
          zoneSettings={settings.zones}
          now={now}
          use24Hour={settings.use24Hour}
        />

        {/* Settings */}
        <SettingsPanel
          zoneSettings={settings.zones}
          onUpdateZone={updateZoneSettings}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
