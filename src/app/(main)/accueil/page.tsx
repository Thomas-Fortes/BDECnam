"use client";

import Link from "next/link";
import { PartyPopper, Trophy } from "lucide-react";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { NextActivityCard } from "@/components/activity/NextActivityCard";
import { CurrentActivityCard } from "@/components/activity/CurrentActivityCard";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { Countdown } from "@/components/countdown/Countdown";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParticipantContext } from "@/components/providers/ParticipantProvider";
import { useActivities, currentAndNextActivity } from "@/hooks/useActivities";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { useSettings } from "@/hooks/useSettings";
import { useClock } from "@/hooks/useClock";
import { useTeam } from "@/hooks/useTeam";

export default function AccueilPage() {
  const { participant } = useParticipantContext();
  const now = useClock(1000);
  const { activities, cachedAt } = useActivities();
  const { announcements } = useAnnouncements();
  const { teams } = useRealtimeLeaderboard();
  const { settings } = useSettings();
  const team = useTeam(participant?.team_id ?? null);

  if (!participant) return null;

  const { current, next } = currentAndNextActivity(activities, now);
  const hasStarted = activities.some((a) => new Date(a.starts_at).getTime() <= now.getTime());
  const isOver = activities.length > 0 && !current && !next && hasStarted;
  const notStartedYet = activities.length === 0 || (!current && !next && !hasStarted);
  const topAnnouncement = announcements[0];

  return (
    <div className="flex flex-col gap-5">
      <OfflineBanner cachedAt={cachedAt} />

      <div className="flex items-center gap-3">
        <ParticipantAvatar
          firstName={participant.first_name}
          lastName={participant.last_name}
          photoPath={participant.photo_path}
          teamColor={team?.color}
          size="lg"
        />
        <div>
          <p className="text-xl font-bold">Salut {participant.first_name} ! 👋</p>
          {team && (
            <Badge style={{ backgroundColor: team.color, color: "white" }} className="mt-1">
              {team.name}
            </Badge>
          )}
        </div>
      </div>

      {notStartedYet && settings?.start_date && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <PartyPopper className="size-8 text-primary" />
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Départ dans…</p>
            <Countdown targetIso={new Date(`${settings.start_date}T00:00:00`).toISOString()} />
          </CardContent>
        </Card>
      )}

      {current && <CurrentActivityCard activity={current} />}
      {next && <NextActivityCard activity={next} />}

      {isOver && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
            <Trophy className="size-8 text-primary" />
            <p className="text-lg font-bold">C&apos;est fini, merci pour ce WEI ! 🥳</p>
            <p className="text-sm text-muted-foreground">Retrouve le classement final ci-dessous.</p>
          </CardContent>
        </Card>
      )}

      {topAnnouncement && <AnnouncementBanner announcement={topAnnouncement} />}

      {teams.length > 0 && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Top équipes</p>
              <Link href="/classement" className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                Voir tout
              </Link>
            </div>
            <ol className="space-y-2">
              {teams.slice(0, 3).map((t, i) => (
                <li key={t.team_id} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-center font-bold text-muted-foreground">{i + 1}</span>
                  <span className="size-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="flex-1 truncate font-medium">{t.name}</span>
                  <span className="font-bold">{t.points} pts</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
