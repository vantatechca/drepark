import { SPOT_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SpotStatusBadgeProps {
  status: string;
  className?: string;
}

export function SpotStatusBadge({ status, className }: SpotStatusBadgeProps) {
  const statusConfig =
    SPOT_STATUSES[status as keyof typeof SPOT_STATUSES] ??
    SPOT_STATUSES.suggested;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        statusConfig.color,
        className
      )}
    >
      {statusConfig.label}
    </span>
  );
}
