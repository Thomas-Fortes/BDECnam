import type { ActivityType } from "@/lib/types";

export const TIMEZONE = "Europe/Paris";

export const QUICK_POINT_AMOUNTS = [5, 10, 20, -5] as const;

// Palette de la charte BDE CIAA (Figma "DA & logo").
export const DEFAULT_TEAM_COLORS = [
  "#3030D0", // bleu (BDE)
  "#FFC501", // jaune (Events)
  "#FF4800", // orange (Clubs)
  "#FF97D6", // rose (Aide)
  "#00DEB5", // turquoise (Intégration)
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
