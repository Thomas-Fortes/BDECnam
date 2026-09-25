import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { AnimatedPoints } from "@/components/leaderboard/AnimatedPoints";
import { cn } from "cn";

export interface LeaderboardRow {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string | null;
  points: number;
  photoPath?: string | null;
  color?: string | null;
}

export function LeaderboardList({
  rows,
  highlightId,
}: {
  rows: LeaderboardRow[];
  highlightId?: string | null;
}) {
  return (
    <ol className="divide-y rounded-lg border">
      {rows.map((row, i) => {
        const rank = i + 1;
        const mine = row.id === highlightId;
        return (
          <li
            key={row.id}
            id={mine ? "my-leaderboard-row" : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5", mine && "bg-primary/10")}
          >
            <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">{rank}</span>
            <ParticipantAvatar
              firstName={row.primaryLabel}
              lastName={row.secondaryLabel ?? ""}
              photoPath={row.photoPath}
              teamColor={row.color}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {row.primaryLabel} {row.secondaryLabel}
                {mine && <span className="ml-1.5 text-xs font-normal text-primary">(toi)</span>}
              </p>
            </div>
            <AnimatedPoints value={row.points} className="shrink-0 text-sm font-bold tabular-nums" />
          </li>
        );
      })}
      {rows.length === 0 && (
        <li className="py-6 text-center text-sm text-muted-foreground">Personne pour l&apos;instant.</li>
      )}
    </ol>
  );
}
