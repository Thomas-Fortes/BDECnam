"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OfflineBanner({ cachedAt }: { cachedAt?: string | null }) {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <WifiOff className="size-4 shrink-0" />
      <span>
        Hors ligne{cachedAt ? ` — données du ${formatTime(cachedAt)}` : ""}
      </span>
    </div>
  );
}
