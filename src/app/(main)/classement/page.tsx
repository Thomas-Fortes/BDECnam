"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Podium } from "@/components/leaderboard/Podium";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { PointsFeed } from "@/components/leaderboard/PointsFeed";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { useParticipantContext } from "@/components/providers/ParticipantProvider";
import { Locate } from "lucide-react";

export default function ClassementPage() {
  const { participant } = useParticipantContext();
  const { individual, teams, cachedAt } = useRealtimeLeaderboard();

  function scrollToMe() {
    document.getElementById("my-leaderboard-row")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner cachedAt={cachedAt} />
      <h1 className="text-xl font-bold">Classement</h1>

      <Tabs defaultValue="teams">
        <TabsList className="w-full">
          <TabsTrigger value="teams">Équipes</TabsTrigger>
          <TabsTrigger value="individual">Individuel</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="flex flex-col gap-4 pt-4">
          <Podium
            entries={teams.slice(0, 3).map((t) => ({ id: t.team_id, label: t.name, points: t.points, color: t.color }))}
          />
          <LeaderboardList
            rows={teams.map((t) => ({ id: t.team_id, primaryLabel: t.name, points: t.points, color: t.color }))}
            highlightId={participant?.team_id}
          />
        </TabsContent>

        <TabsContent value="individual" className="flex flex-col gap-4 pt-4">
          <Podium
            entries={individual.slice(0, 3).map((p) => ({
              id: p.participant_id,
              label: p.first_name,
              points: p.points,
              photoPath: p.photo_path,
              color: p.team_color,
            }))}
          />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={scrollToMe}>
              <Locate className="size-4" />
              Ma position
            </Button>
          </div>
          <LeaderboardList
            rows={individual.map((p) => ({
              id: p.participant_id,
              primaryLabel: p.first_name,
              secondaryLabel: p.last_name,
              points: p.points,
              photoPath: p.photo_path,
              color: p.team_color,
            }))}
            highlightId={participant?.id}
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-2 pt-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Derniers points</h2>
        <PointsFeed />
      </div>
    </div>
  );
}
