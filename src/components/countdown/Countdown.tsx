"use client";

import { useClock } from "@/hooks/useClock";
import { getCountdown } from "@/lib/time";
import { cn } from "cn";

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums text-3xl font-bold sm:text-4xl">{String(value).padStart(2, "0")}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function Countdown({ targetIso, className }: { targetIso: string; className?: string }) {
  const now = useClock(1000);
  const c = getCountdown(targetIso, now);

  if (c.isPast) {
    return <p className={cn("text-lg font-semibold", className)}>C&apos;est parti ! 🎉</p>;
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Unit value={c.days} label="jours" />
      <Unit value={c.hours} label="h" />
      <Unit value={c.minutes} label="min" />
      <Unit value={c.seconds} label="sec" />
    </div>
  );
}
