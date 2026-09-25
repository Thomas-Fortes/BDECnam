"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ACTIVITY_ICONS } from "@/components/activity/activity-icons";
import { useClock } from "@/hooks/useClock";
import { progressBetween, formatTime } from "@/lib/time";
import type { Activity } from "@/lib/types";

export function CurrentActivityCard({ activity }: { activity: Activity }) {
  const now = useClock(5000);
  const Icon = ACTIVITY_ICONS[activity.type];
  const progress = progressBetween(activity.starts_at, activity.ends_at, now);

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En ce moment</p>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-primary" />
          {activity.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Jusqu&apos;à {formatTime(activity.ends_at)}</span>
          {activity.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {activity.location_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
