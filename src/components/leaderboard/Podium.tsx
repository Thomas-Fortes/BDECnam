import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { cn } from "cn";

export interface PodiumEntry {
  id: string;
  label: string;
  points: number;
  photoPath?: string | null;
  color?: string | null;
}

const ORDER = [1, 0, 2]; // affichage : 2e - 1er - 3e
// Indexés par rang (0 = 1er, 1 = 2e, 2 = 3e) : le 1er doit être le plus grand.
const HEIGHTS = ["h-32", "h-24", "h-20"];
const AVATAR_SIZE = ["xl", "lg", "lg"] as const;

export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-3">
      {ORDER.map((idx) => {
        const entry = top3[idx];
        if (!entry) return <div key={idx} className="flex-1" />;
        const rank = idx + 1;

        return (
          <div key={entry.id} className="flex flex-1 flex-col items-center gap-2">
            <ParticipantAvatar
              firstName={entry.label}
              lastName=""
              photoPath={entry.photoPath}
              teamColor={entry.color}
              size={AVATAR_SIZE[idx]}
            />
            <p className="w-full truncate text-center text-xs font-semibold">{entry.label}</p>
            <p className="text-sm font-bold text-primary">{entry.points} pts</p>
            <div
              className={cn(
                "flex w-full items-start justify-center rounded-t-lg pt-1 text-lg font-bold text-white",
                HEIGHTS[idx]
              )}
              style={{ backgroundColor: entry.color ?? "#64748B" }}
            >
              {rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}
