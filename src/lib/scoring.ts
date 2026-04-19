import { SCORE_WEIGHTS } from "./constants";

export function calculateOverallScore(scores: {
  proximity: number;
  visibility: number;
  footTraffic: number;
  vibe: number;
  networking: number;
}): number {
  const overall =
    scores.proximity * SCORE_WEIGHTS.proximity +
    scores.visibility * SCORE_WEIGHTS.visibility +
    scores.footTraffic * SCORE_WEIGHTS.foot_traffic +
    scores.vibe * SCORE_WEIGHTS.vibe +
    scores.networking * SCORE_WEIGHTS.networking;

  return Math.round(overall * 10) / 10;
}

export function getTimeSlotFromHour(hour: number): string {
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getDayOfWeek(date: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

export function calculateDuration(arrived: string, departed: string): number {
  const [aH, aM] = arrived.split(":").map(Number);
  const [dH, dM] = departed.split(":").map(Number);
  return (dH * 60 + dM) - (aH * 60 + aM);
}
