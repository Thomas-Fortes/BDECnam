"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

export function AnimatedPoints({ value, className }: { value: number; className?: string }) {
  const previous = useRef(value);
  const [pulse, setPulse] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value !== previous.current) {
      setPulse(value > previous.current ? "up" : "down");
      previous.current = value;
      const id = setTimeout(() => setPulse(null), 900);
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <span
      className={cn(
        "inline-block rounded px-1 transition-colors duration-500",
        pulse === "up" && "scale-110 bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200",
        pulse === "down" && "scale-110 bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200",
        className
      )}
    >
      {value} pts
    </span>
  );
}
