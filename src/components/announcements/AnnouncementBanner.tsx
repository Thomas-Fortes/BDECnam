import { Megaphone, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/time";
import type { Announcement } from "@/lib/types";

export function AnnouncementBanner({ announcement }: { announcement: Announcement }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex gap-3 py-4">
        {announcement.pinned ? (
          <Pin className="mt-0.5 size-5 shrink-0 text-primary" />
        ) : (
          <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-snug">{announcement.message}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(announcement.created_at)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
