import type { ActivityType } from "@/lib/types";

export const TIMEZONE = "Europe/Paris";

export const QUICK_POINT_AMOUNTS = [5, 10, 20, -5] as const;

export const DEFAULT_TEAM_COLORS = [
  "#EC4899", // rose
  "#3B82F6", // bleu
  "#F59E0B", // ambre
  "#22C55E", // vert
  "#8B5CF6", // violet
  "#F97316", // orange
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  activite: "Activité",
  repas: "Repas",
  transport: "Transport",
  soiree: "Soirée",
  autre: "Autre",
};

export function publicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export const EMERGENCY_NUMBERS = [
  { label: "SAMU", number: "15" },
  { label: "Police", number: "17" },
  { label: "Pompiers", number: "18" },
  { label: "Urgences (UE)", number: "112" },
];
