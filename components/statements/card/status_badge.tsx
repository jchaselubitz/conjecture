import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isPublished: boolean;
  className?: string;
}

export function StatusBadge({ isPublished, className }: StatusBadgeProps) {
  return isPublished ? (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800",
        className
      )}
    >
      Published
    </span>
  ) : (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800",
        className
      )}
    >
      Draft
    </span>
  );
}
