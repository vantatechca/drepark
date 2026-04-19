"use client";

import { DAYS_OF_WEEK, TIME_SLOTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState } from "react";

type HeatmapCell = {
  dayOfWeek: string;
  timeSlot: string;
  value: number;
  visitCount: number;
};

interface TimingHeatmapProps {
  data: HeatmapCell[];
}

function getCellColor(value: number, visitCount: number): string {
  if (visitCount === 0 || value === 0) return "bg-zinc-800 border-zinc-700";
  if (value >= 4.0) return "bg-emerald-500/80 border-emerald-500/50";
  if (value >= 3.0) return "bg-emerald-500/40 border-emerald-500/30";
  if (value >= 2.0) return "bg-amber-500/40 border-amber-500/30";
  return "bg-zinc-700 border-zinc-600";
}

function getCellLabel(value: number, visitCount: number): string {
  if (visitCount === 0) return "No data";
  return `${value.toFixed(1)}/5 avg (${visitCount} visit${visitCount !== 1 ? "s" : ""})`;
}

const TIME_SLOT_KEYS = Object.keys(TIME_SLOTS) as Array<keyof typeof TIME_SLOTS>;

export function TimingHeatmap({ data }: TimingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    day: string;
    slot: string;
    value: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of data) {
    cellMap.set(`${cell.dayOfWeek}::${cell.timeSlot}`, cell);
  }

  const hasData = data.length > 0;

  return (
    <div className="relative">
      {/* Time slot headers */}
      <div className="flex gap-1 mb-1 ml-[88px]">
        {TIME_SLOT_KEYS.map((slot) => (
          <div
            key={slot}
            className="flex-1 text-center text-[10px] text-zinc-500 font-medium leading-tight"
          >
            <div>{TIME_SLOTS[slot].label}</div>
            <div className="text-zinc-600">{TIME_SLOTS[slot].range}</div>
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="flex flex-col gap-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex items-center gap-1">
            <div className="w-20 text-xs text-zinc-400 font-medium text-right pr-2 flex-shrink-0">
              {day.slice(0, 3)}
            </div>
            {TIME_SLOT_KEYS.map((slot) => {
              const key = `${day}::${slot}`;
              const cell = cellMap.get(key);
              const value = cell?.value ?? 0;
              const count = cell?.visitCount ?? 0;

              return (
                <div
                  key={slot}
                  className={cn(
                    "flex-1 h-10 rounded border cursor-default transition-all duration-150",
                    "hover:opacity-100 hover:ring-1 hover:ring-amber-500/50",
                    getCellColor(value, count),
                    !hasData && "opacity-30"
                  )}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({
                      day,
                      slot,
                      value,
                      count,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {count > 0 && value >= 3.0 && (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white/80">
                        {value.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl text-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 70,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold text-white mb-0.5">
            {tooltip.day} — {TIME_SLOTS[tooltip.slot as keyof typeof TIME_SLOTS]?.label}
          </div>
          <div className="text-zinc-400">
            {getCellLabel(tooltip.value, tooltip.count)}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 justify-end">
        <span className="text-xs text-zinc-500">Low</span>
        <div className="flex gap-1">
          <div className="w-5 h-3 rounded bg-zinc-800 border border-zinc-700" />
          <div className="w-5 h-3 rounded bg-amber-500/40 border border-amber-500/30" />
          <div className="w-5 h-3 rounded bg-emerald-500/40 border border-emerald-500/30" />
          <div className="w-5 h-3 rounded bg-emerald-500/80 border border-emerald-500/50" />
        </div>
        <span className="text-xs text-zinc-500">High</span>
      </div>

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-zinc-500 text-sm bg-zinc-900/80 px-4 py-2 rounded-lg">
            Log visits to see timing patterns
          </p>
        </div>
      )}
    </div>
  );
}
