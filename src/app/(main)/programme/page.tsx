"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { useActivities } from "@/hooks/useActivities";
import { dayKey, formatDayLabel } from "@/lib/time";

export default function ProgrammePage() {
  const { activities, loading, cachedAt } = useActivities();

  const days = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: typeof activities }>();
    for (const activity of [...activities].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    )) {
      const key = dayKey(activity.starts_at);
      if (!map.has(key)) {
        map.set(key, { key, label: formatDayLabel(activity.starts_at), items: [] });
      }
      map.get(key)!.items.push(activity);
    }
    return [...map.values()];
  }, [activities]);

  const todayKey = dayKey(new Date().toISOString());
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab ?? days.find((d) => d.key === todayKey)?.key ?? days[0]?.key;

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner cachedAt={cachedAt} />
      <h1 className="text-xl font-bold">Programme</h1>

      {!loading && days.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Le programme n&apos;est pas encore publié.</p>
      )}

      {days.length > 0 && activeTab && (
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as string)}>
          <TabsList className="w-full">
            {days.map((d) => (
              <TabsTrigger key={d.key} value={d.key} className="capitalize">
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {days.map((d) => (
            <TabsContent key={d.key} value={d.key} className="pt-4">
              <ActivityTimeline activities={d.items} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
