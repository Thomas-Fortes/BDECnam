import { TIMEZONE } from "@/lib/constants";

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDayLabel(iso: string): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayKey(iso: string): string {
  // clé de regroupement stable (YYYY-MM-DD) dans le fuseau Europe/Paris
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function getCountdown(targetIso: string, now: Date = new Date()): CountdownParts {
  const diff = new Date(targetIso).getTime() - now.getTime();
  const isPast = diff <= 0;
  const abs = Math.abs(diff);

  return {
    totalMs: diff,
    days: Math.floor(abs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((abs / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((abs / (1000 * 60)) % 60),
    seconds: Math.floor((abs / 1000) % 60),
    isPast,
  };
}

/** Pour <input type="datetime-local"> : suppose que l'appareil de l'orga est
 *  à l'heure de Paris (cas normal sur place pendant le WEI). */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function progressBetween(startIso: string, endIso: string, now: Date = new Date()): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const t = now.getTime();
  if (t <= start) return 0;
  if (t >= end) return 100;
  return Math.round(((t - start) / (end - start)) * 100);
}
