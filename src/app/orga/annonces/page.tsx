"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pin, Trash2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/time";
import type { Announcement } from "@/lib/types";

export default function OrgaAnnoncesPage() {
  const [message, setMessage] = useState("");
  const [pinned, setPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setAnnouncements((data as Announcement[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("announcements")
        .insert({ message: message.trim(), pinned, created_by: user!.id });
      if (error) throw error;

      toast.success("Annonce envoyée !");
      setMessage("");
      setPinned(false);
      load();
    } catch {
      toast.error("Impossible d'envoyer l'annonce.");
    } finally {
      setSending(false);
    }
  }

  async function togglePin(a: Announcement) {
    const supabase = createClient();
    await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    load();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Annonces</h2>

      <Card>
        <CardContent className="space-y-3 py-4">
          <Textarea
            placeholder="Ton message pour tout le monde…"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="pin" checked={pinned} onCheckedChange={setPinned} />
              <Label htmlFor="pin">Épingler</Label>
            </div>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : "Envoyer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <ul className="space-y-2">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start gap-2 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => togglePin(a)} aria-label="Épingler">
                <Pin className={`size-3.5 ${a.pinned ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(a.id)} aria-label="Supprimer">
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
