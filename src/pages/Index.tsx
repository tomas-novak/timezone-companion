import { useState } from "react";
import { Header } from "@/components/Header";
import { ClockCard } from "@/components/ClockCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ScheduleView } from "@/components/ScheduleView";
import { Footer } from "@/components/Footer";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useSettings } from "@/hooks/useSettings";
import { TIMEZONE_CONFIGS } from "@/lib/timezones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarDays } from "lucide-react";

const Index = () => {
  const now = useLiveClock();
  const { settings, toggle24Hour, toggleDarkMode, updateZoneSettings, moveZone } = useSettings();
  const [activeTab, setActiveTab] = useState("clocks");

  // Get ordered timezone configs
  const orderedConfigs = settings.zoneOrder
    .map((id) => TIMEZONE_CONFIGS.find((z) => z.id === id))
    .filter((z): z is (typeof TIMEZONE_CONFIGS)[0] => z !== undefined);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        use24Hour={settings.use24Hour}
        isDarkMode={settings.isDarkMode}
        onToggle24Hour={toggle24Hour}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 container py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-6">
            <TabsTrigger value="clocks" className="gap-2">
              <Clock size={16} />
              Clocks
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <CalendarDays size={16} />
              Schedule View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clocks" className="space-y-6">
            {/* Clock Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {orderedConfigs.map((config) => (
                <ClockCard
                  key={config.id}
                  config={config}
                  settings={settings.zones[config.id]}
                  now={now}
                  use24Hour={settings.use24Hour}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleView
              zoneSettings={settings.zones}
              zoneOrder={settings.zoneOrder}
              now={now}
              use24Hour={settings.use24Hour}
            />
          </TabsContent>
        </Tabs>

        {/* Settings */}
        <SettingsPanel
          zoneSettings={settings.zones}
          zoneOrder={settings.zoneOrder}
          use24Hour={settings.use24Hour}
          onUpdateZone={updateZoneSettings}
          onMoveZone={moveZone}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
