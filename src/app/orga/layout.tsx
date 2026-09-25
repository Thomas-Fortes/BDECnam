"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useOrganizer } from "@/hooks/useOrganizer";
import { cn } from "cn";

const TABS = [
  { href: "/orga/points", label: "Points" },
  { href: "/orga/historique", label: "Historique" },
  { href: "/orga/defis", label: "Défis photo" },
  { href: "/orga/avatars", label: "Avatars" },
  { href: "/orga/programme", label: "Programme" },
  { href: "/orga/annonces", label: "Annonces" },
  { href: "/orga/participants", label: "Participants" },
  { href: "/orga/reglages", label: "Réglages" },
];

export default function OrgaLayout({ children }: { children: React.ReactNode }) {
  const { isOrga, loading } = useOrganizer();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isOrga) {
      router.replace("/profil");
    }
  }, [loading, isOrga, router]);

  if (loading || !isOrga) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Link href="/profil" className="text-muted-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold">Espace orga</h1>
        </div>
        <div className="mx-auto max-w-2xl overflow-x-auto px-4 pb-2">
          <nav className="flex w-max gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  pathname?.startsWith(tab.href)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">{children}</div>
    </div>
  );
}
