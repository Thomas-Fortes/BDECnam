"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/brand/Logo";
import { ParticipantProvider, useParticipantContext } from "@/components/providers/ParticipantProvider";

function Guard({ children }: { children: React.ReactNode }) {
  const { participant, loading } = useParticipantContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !participant) {
      router.replace("/inscription");
    }
  }, [loading, participant, router]);

  if (loading || !participant) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParticipantProvider>
      <Guard>
        <div className="mx-auto w-full max-w-md px-4 pt-4">
          <Logo size="sm" />
        </div>
        <div className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-3">{children}</div>
        <BottomNav />
      </Guard>
    </ParticipantProvider>
  );
}
