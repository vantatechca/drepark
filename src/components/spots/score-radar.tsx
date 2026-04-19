"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ScoreRadarProps {
  proximity: number;
  visibility: number;
  footTraffic: number;
  vibe: number;
  networking: number;
}

export function ScoreRadar({
  proximity,
  visibility,
  footTraffic,
  vibe,
  networking,
}: ScoreRadarProps) {
  const data = [
    { dimension: "Proximity", value: proximity },
    { dimension: "Visibility", value: visibility },
    { dimension: "Foot Traffic", value: footTraffic },
    { dimension: "Vibe", value: vibe },
    { dimension: "Networking", value: networking },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.16 0.005 250)",
            border: "1px solid rgba(212,168,67,0.3)",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value) => [Number(value).toFixed(1), "Score"]}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#d4a843"
          fill="#d4a843"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ fill: "#d4a843", r: 4 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
