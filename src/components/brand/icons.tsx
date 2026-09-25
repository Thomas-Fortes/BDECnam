import type { SVGProps } from "react";

/** Sparkle 8 branches, repris de l'identité BDE CIAA (icône "Events"). */
export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M 12 2 L 13.22 9.04 L 19.07 4.93 L 14.96 10.78 L 22 12 L 14.96 13.22 L 19.07 19.07 L 13.22 14.96 L 12 22 L 10.78 14.96 L 4.93 19.07 L 9.04 13.22 L 2 12 L 9.04 10.78 L 4.93 4.93 L 10.78 9.04 Z" />
    </svg>
  );
}

/** Icône "signal" (3 arcs), reprise de l'identité BDE CIAA (logo "ciaa"). */
export function SignalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" {...props}>
      <path d="M4 4a16 16 0 0 1 16 16" />
      <path d="M4 9a11 11 0 0 1 11 11" />
      <path d="M4 14a6 6 0 0 1 6 6" />
    </svg>
  );
}
