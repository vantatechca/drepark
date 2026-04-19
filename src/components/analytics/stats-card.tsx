"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number | string;
  previousValue?: number;
  format?: "number" | "decimal" | "rating";
  icon?: React.ReactNode;
  className?: string;
}

function formatValue(value: number | string, format: string): string {
  if (typeof value === "string") return value;
  if (format === "decimal") return value.toFixed(1);
  if (format === "rating") return `${value.toFixed(1)}/5`;
  return value.toLocaleString();
}

function calcTrend(
  current: number,
  prev: number
): { pct: number; dir: "up" | "down" | "neutral" } {
  if (prev === 0 && current === 0) return { pct: 0, dir: "neutral" };
  if (prev === 0) return { pct: 100, dir: "up" };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "neutral" };
}

export function StatsCard({
  label,
  value,
  previousValue,
  format = "number",
  icon,
  className,
}: StatsCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value as string) || 0;
  const trend =
    previousValue !== undefined
      ? calcTrend(numericValue, previousValue)
      : null;

  return (
    <Card className={cn("bg-zinc-900 border-zinc-800", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-white">
              {formatValue(value, format)}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {trend.dir === "up" && (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {trend.dir === "down" && (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
                {trend.dir === "neutral" && (
                  <Minus className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.dir === "up" && "text-emerald-400",
                    trend.dir === "down" && "text-red-400",
                    trend.dir === "neutral" && "text-zinc-500"
                  )}
                >
                  {trend.dir === "neutral"
                    ? "No change"
                    : `${trend.pct}% vs last month`}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-3 text-amber-400 opacity-70 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
