import { Utensils, Bus, PartyPopper, Sparkles, Dumbbell } from "lucide-react";
import type { ActivityType } from "@/lib/types";

export const ACTIVITY_ICONS: Record<ActivityType, typeof Utensils> = {
  repas: Utensils,
  transport: Bus,
  soiree: PartyPopper,
  activite: Dumbbell,
  autre: Sparkles,
};
