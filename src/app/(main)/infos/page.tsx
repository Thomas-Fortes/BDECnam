"use client";

import { useEffect, useState } from "react";
import { MapPin, Bus, Phone, ShieldAlert, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { useSettings } from "@/hooks/useSettings";
import { EMERGENCY_NUMBERS, publicStorageUrl } from "@/lib/constants";
import { formatDayLabel } from "@/lib/time";

const CHECKLIST_STORAGE_KEY = "wei-checklist-checked";

export default function InfosPage() {
  const { settings, cachedAt } = useSettings();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function toggle(item: string) {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-4">
        <OfflineBanner cachedAt={cachedAt} />
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des infos…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <OfflineBanner cachedAt={cachedAt} />
      <h1 className="text-xl font-bold">Infos pratiques</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-primary" />
            Dates &amp; lieu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.start_date && settings.end_date && (
            <p className="text-sm">
              Du {formatDayLabel(settings.start_date)} au {formatDayLabel(settings.end_date)}
            </p>
          )}
          {settings.address && <p className="text-sm text-muted-foreground">{settings.address}</p>}
          {settings.address_url && (
            <Button size="sm" variant="secondary" render={<a href={settings.address_url} target="_blank" rel="noreferrer" />}>
              Ouvrir dans Maps
            </Button>
          )}
        </CardContent>
      </Card>

      {settings.transport_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus className="size-4 text-primary" />
              Transport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{settings.transport_info}</p>
          </CardContent>
        </Card>
      )}

      {settings.site_map_path && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carte du site</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicStorageUrl("settings", settings.site_map_path)}
              alt="Carte du site du WEI"
              className="w-full rounded-lg border object-cover"
            />
          </CardContent>
        </Card>
      )}

      {settings.checklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">À emporter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {settings.checklist.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm hover:bg-muted"
              >
                {checked[item] ? (
                  <CheckSquare className="size-4 shrink-0 text-primary" />
                ) : (
                  <Square className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={checked[item] ? "text-muted-foreground line-through" : ""}>{item}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {settings.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4 text-primary" />
              Contacts orga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings.contacts.map((c) => (
              <div key={c.phone} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{c.first_name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
                <Button size="sm" variant="outline" render={<a href={`tel:${c.phone}`} />}>
                  Appeler
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <ShieldAlert className="size-4" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Un souci, une envie de rentrer, une situation qui ne va pas ? Contacte un référent safe, en toute
            confidentialité et sans jugement. On est là pour que le WEI se passe bien pour tout le monde.
          </p>

          {settings.safety_contacts.length > 0 && (
            <div className="space-y-2">
              {settings.safety_contacts.map((c) => (
                <div key={c.phone} className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{c.first_name} — référent·e safe</p>
                  <Button size="sm" variant="destructive" render={<a href={`tel:${c.phone}`} />}>
                    Appeler
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            {EMERGENCY_NUMBERS.map((n) => (
              <a
                key={n.number}
                href={`tel:${n.number}`}
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm font-semibold"
              >
                {n.label}
                <span className="tabular-nums">{n.number}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
