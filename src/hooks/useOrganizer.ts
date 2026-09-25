"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isOrganizer } from "@/lib/auth";

export function useOrganizer() {
  const [isOrga, setIsOrga] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    isOrganizer(supabase).then((value) => {
      if (active) {
        setIsOrga(value);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { isOrga, loading };
}
