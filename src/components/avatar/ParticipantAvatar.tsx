import { publicStorageUrl } from "@/lib/constants";
import { cn } from "cn";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
  "2xl": "size-32 text-4xl",
} as const;

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function ParticipantAvatar({
  firstName,
  lastName,
  photoPath,
  teamColor,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  photoPath?: string | null;
  teamColor?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const bg = teamColor ?? "#64748B";

  if (photoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={publicStorageUrl("avatars", photoPath)}
        alt={`Photo de ${firstName} ${lastName}`}
        className={cn(SIZES[size], "shrink-0 rounded-full object-cover ring-2 ring-background", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        SIZES[size],
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-background",
        className
      )}
      style={{ backgroundColor: bg }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials(firstName, lastName)}
    </div>
  );
}
