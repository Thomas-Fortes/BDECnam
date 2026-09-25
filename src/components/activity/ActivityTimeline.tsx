"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_ICONS } from "@/components/activity/activity-icons";
import { useClock } from "@/hooks/useClock";
import { formatTime } from "@/lib/time";
import { ACTIVITY_TYPE_LABELS } from "@/lib/constants";
import { cn } from "cn";
import type { Activity } from "@/lib/types";

type Status = "avenir" | "encours" | "termine";

function getStatus(activity: Activity, now: Date): Status {
  const t = now.getTime();
  const start = new Date(activity.starts_at).getTime();
  const end = new Date(activity.ends_at).getTime();
  if (t < start) return "avenir";
  if (t >= end) return "termine";
  return "encours";
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const now = useClock(15000);
  const [selected, setSelected] = useState<Activity | null>(null);

  const sorted = [...activities].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  return (
    <>
      <ol className="relative space-y-1 border-l-2 border-muted pl-4">
        {sorted.map((activity) => {
          const status = getStatus(activity, now);
          const Icon = ACTIVITY_ICONS[activity.type];

          return (
            <li key={activity.id} className="relative pb-3">
              <span
                className={cn(
                  "absolute -left-[21px] top-1 size-3 rounded-full border-2 border-background",
                  status === "encours" && "bg-primary",
                  status === "avenir" && "bg-muted-foreground/40",
                  status === "termine" && "bg-muted-foreground/20"
                )}
              />
              <button
                type="button"
                onClick={() => setSelected(activity)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted",
                  status === "encours" && "bg-primary/10 ring-1 ring-primary/30",
                  status === "termine" && "opacity-50"
                )}
              >
                <div className="w-12 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {formatTime(activity.starts_at)}
                </div>
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activity.title}</p>
                  {activity.location_name && (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {activity.location_name}
                    </p>
                  )}
                </div>
                {status === "encours" && (
                  <Badge className="shrink-0">En cours</Badge>
                )}
              </button>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Rien de prévu ce jour-là.</p>
        )}
      </ol>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {selected && (
            <>
              <SheetHeader>
                <Badge variant="secondary" className="mb-1 w-fit">
                  {ACTIVITY_TYPE_LABELS[selected.type]}
                </Badge>
                <SheetTitle className="text-xl">{selected.title}</SheetTitle>
                <SheetDescription>
                  {formatTime(selected.starts_at)} – {formatTime(selected.ends_at)}
                  {selected.location_name ? ` · ${selected.location_name}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                {selected.description && <p className="text-sm leading-relaxed">{selected.description}</p>}
                {selected.menu && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Au menu</p>
                    <p className="text-sm">{selected.menu}</p>
                  </div>
                )}
                {selected.points_info && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Points en jeu</p>
                    <p className="text-sm">{selected.points_info}</p>
                  </div>
                )}
                {selected.location_url && (
                  <a
                    href={selected.location_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    <MapPin className="size-4" />
                    Ouvrir dans Maps
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
