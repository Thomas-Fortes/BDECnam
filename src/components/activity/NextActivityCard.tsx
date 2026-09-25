import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/countdown/Countdown";
import { ACTIVITY_ICONS } from "@/components/activity/activity-icons";
import type { Activity } from "@/lib/types";

export function NextActivityCard({ activity }: { activity: Activity }) {
  const Icon = ACTIVITY_ICONS[activity.type];

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prochaine activité</p>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Icon className="size-5 text-primary" />
          {activity.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Countdown targetIso={activity.starts_at} />
        {activity.location_name && (
          <a
            href={activity.location_url ?? "#"}
            target={activity.location_url ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <MapPin className="size-4" />
            {activity.location_name}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
