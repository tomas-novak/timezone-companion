import { useState } from "react";
import { Header } from "@/components/Header";
import { ClockCard } from "@/components/ClockCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ScheduleView } from "@/components/ScheduleView";
import { Footer } from "@/components/Footer";
import { AddCityDialog } from "@/components/AddCityDialog";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useSettings } from "@/hooks/useSettings";
import { MAX_ZONES, resolveHomeTz } from "@/lib/timezones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarDays } from "lucide-react";

const Index = () => {
  const now = useLiveClock();
  const { settings, toggle24Hour, toggleDarkMode, updateZone, addZone, removeZone, moveZone, setHomeTz } =
    useSettings();
  const homeTz = resolveHomeTz(settings.homeTz);
  const [activeTab, setActiveTab] = useState("clocks");

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        use24Hour={settings.use24Hour}
        isDarkMode={settings.isDarkMode}
        onToggle24Hour={toggle24Hour}
        onToggleDarkMode={toggleDarkMode}
        homeTz={settings.homeTz}
        onHomeTzChange={setHomeTz}
        zones={settings.zones}
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

          <div className="mb-4 flex items-center justify-end gap-3">
            {settings.zones.length === 0 && (
              <p className="text-sm text-muted-foreground">No cities yet.</p>
            )}
            {settings.zones.length >= MAX_ZONES && (
              <p className="text-sm text-muted-foreground">
                Up to {MAX_ZONES} cities. Remove one in Settings to add another.
              </p>
            )}
            <AddCityDialog
              onAdd={addZone}
              disabled={settings.zones.length >= MAX_ZONES}
              homeTz={settings.zones.some((zone) => zone.tz === homeTz) ? null : homeTz}
            />
          </div>

          <TabsContent value="clocks" className="space-y-6">
            {/* Clock Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {settings.zones.map((zone) => (
                <ClockCard
                  key={zone.id}
                  zone={zone}
                  now={now}
                  use24Hour={settings.use24Hour}
                  homeTz={homeTz}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleView
              zones={settings.zones}
              now={now}
              use24Hour={settings.use24Hour}
              homeTz={homeTz}
            />
          </TabsContent>
        </Tabs>

        {/* Settings */}
        <SettingsPanel
          zones={settings.zones}
          use24Hour={settings.use24Hour}
          onUpdateZone={updateZone}
          onRemoveZone={removeZone}
          onMoveZone={moveZone}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
