import { getScoreTier } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const tier = getScoreTier(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 rounded",
    md: "text-sm px-2.5 py-1 rounded-md font-semibold",
    lg: "text-2xl px-4 py-2 rounded-lg font-bold",
  };

  return (
    <span
      className={cn(
        sizeClasses[size],
        tier.bg,
        tier.color,
        "inline-flex items-center gap-1",
        className
      )}
    >
      <span>{tier.label}</span>
      <span className="opacity-80">({score.toFixed(1)})</span>
    </span>
  );
}
