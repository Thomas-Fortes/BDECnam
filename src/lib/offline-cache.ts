"use client";

const PREFIX = "wei-cache:";

export interface CachedSnapshot<T> {
  data: T;
  cachedAt: string;
}

export function writeSnapshot<T>(key: string, data: T) {
  try {
    const snapshot: CachedSnapshot<T> = { data, cachedAt: new Date().toISOString() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(snapshot));
  } catch {
    // stockage plein / indisponible : on ignore, ce n'est qu'un cache
  }
}

export function readSnapshot<T>(key: string): CachedSnapshot<T> | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSnapshot<T>;
  } catch {
    return null;
  }
}
