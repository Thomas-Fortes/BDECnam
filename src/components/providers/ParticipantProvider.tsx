"use client";

import { createContext, useContext } from "react";
import { useParticipant } from "@/hooks/useParticipant";
import type { Participant } from "@/lib/types";

interface ParticipantContextValue {
  participant: Participant | null;
  loading: boolean;
  refresh: () => Promise<Participant | null>;
}

const ParticipantContext = createContext<ParticipantContextValue | null>(null);

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const { participant, loading, refresh } = useParticipant();

  return (
    <ParticipantContext.Provider value={{ participant, loading, refresh }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipantContext() {
  const ctx = useContext(ParticipantContext);
  if (!ctx) throw new Error("useParticipantContext must be used within ParticipantProvider");
  return ctx;
}
