import { SparkleIcon, SignalIcon } from "@/components/brand/icons";
import { cn } from "cn";

const SIZES = {
  sm: { text: "text-base", icon: "size-3.5", gap: "gap-1" },
  md: { text: "text-2xl", icon: "size-5", gap: "gap-1.5" },
  lg: { text: "text-4xl", icon: "size-8", gap: "gap-2" },
} as const;

/** Logo "bde✳ciaa" — identité du BDE CIAA, repris depuis la charte Figma.
 *  S'adapte automatiquement au thème clair/sombre. */
export function Logo({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "inline-flex flex-col font-extrabold leading-[0.92] tracking-tight text-foreground",
        s.text,
        className
      )}
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <span className={cn("inline-flex items-center", s.gap)}>
        bde
        <SparkleIcon className={cn(s.icon, "shrink-0 text-[#FFC501]")} />
      </span>
      <span className={cn("inline-flex items-center", s.gap)}>
        <SignalIcon className={cn(s.icon, "shrink-0 text-[#3030D0]")} />
        ciaa
      </span>
    </div>
  );
}
