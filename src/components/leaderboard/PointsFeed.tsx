"use client";

import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { useRecentPoints } from "@/hooks/useRecentPoints";
import { formatTime } from "@/lib/time";
import { cn } from "cn";

export function PointsFeed({ limit = 15 }: { limit?: number }) {
  const { items, loading } = useRecentPoints(limit);

  if (!loading && items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Aucun point distribué pour l&apos;instant.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const name = item.participant
          ? `${item.participant.first_name} ${item.participant.last_name}`
          : item.team
            ? item.team.name
            : "Quelqu'un";

        return (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            {item.participant ? (
              <ParticipantAvatar
                firstName={item.participant.first_name}
                lastName={item.participant.last_name}
                photoPath={item.participant.photo_path}
                size="sm"
              />
            ) : (
              <span
                className="size-8 shrink-0 rounded-full"
                style={{ backgroundColor: item.team?.color ?? "#64748B" }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <span className="font-medium">{name}</span>{" "}
                <span className={cn("font-bold", item.amount >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {item.amount >= 0 ? "+" : ""}
                  {item.amount}
                </span>{" "}
                <span className="text-muted-foreground">· {item.reason}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatTime(item.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
