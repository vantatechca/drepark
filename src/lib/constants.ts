// Spot Types with display labels and icons
export const SPOT_TYPES = {
  cafe: { label: "Cafe", icon: "Coffee" },
  ice_cream: { label: "Ice Cream", icon: "IceCream" },
  brunch: { label: "Brunch", icon: "UtensilsCrossed" },
  restaurant: { label: "Restaurant", icon: "ChefHat" },
  wine_bar: { label: "Wine Bar", icon: "Wine" },
  barber: { label: "Barber", icon: "Scissors" },
  cigar_lounge: { label: "Cigar Lounge", icon: "Flame" },
  gym: { label: "Gym", icon: "Dumbbell" },
  car_meet: { label: "Car Meet", icon: "Car" },
  other: { label: "Other", icon: "MapPin" },
} as const;

export const PARKING_TYPES = {
  street_front: "Street Front",
  tiny_lot: "Tiny Lot",
  street_side: "Street Side",
  shared_small_lot: "Shared Small Lot",
  back_in_possible: "Back-in Possible",
} as const;

export const SPOT_STATUSES = {
  suggested: { label: "Suggested", color: "bg-blue-500/20 text-blue-400" },
  scouted: { label: "Scouted", color: "bg-purple-500/20 text-purple-400" },
  verified: { label: "Verified", color: "bg-green-500/20 text-green-400" },
  favorite: { label: "Favorite", color: "bg-amber-500/20 text-amber-400" },
  blacklisted: { label: "Blacklisted", color: "bg-red-500/20 text-red-400" },
} as const;

export const AUDIENCE_TAGS = [
  { value: "car_guys", label: "Car Guys" },
  { value: "professional_women", label: "Professional Women" },
  { value: "business_networking", label: "Business Networking" },
  { value: "young_professionals", label: "Young Professionals" },
  { value: "brunch_crowd", label: "Brunch Crowd" },
  { value: "evening_social", label: "Evening Social" },
] as const;

export const TIME_SLOTS = {
  early_morning: { label: "Early Morning", range: "5am-8am" },
  morning: { label: "Morning", range: "8am-11am" },
  lunch: { label: "Lunch", range: "11am-2pm" },
  afternoon: { label: "Afternoon", range: "2pm-5pm" },
  evening: { label: "Evening", range: "5pm-9pm" },
  night: { label: "Night", range: "9pm-12am" },
} as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const CROWD_QUALITY_MAP: Record<string, number> = {
  perfect: 5,
  good: 4,
  mediocre: 3,
  wrong_crowd: 2,
  empty: 1,
};

export const SCORE_WEIGHTS = {
  proximity: 0.25,
  visibility: 0.25,
  foot_traffic: 0.2,
  vibe: 0.15,
  networking: 0.15,
} as const;

export const SCORE_TIERS = {
  S: { min: 9.0, label: "S-Tier", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  A: { min: 7.0, label: "A-Tier", color: "text-amber-400", bg: "bg-amber-500/20" },
  B: { min: 5.0, label: "B-Tier", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  C: { min: 3.0, label: "C-Tier", color: "text-orange-400", bg: "bg-orange-500/20" },
  F: { min: 0, label: "Blacklist", color: "text-red-400", bg: "bg-red-500/20" },
} as const;

export function getScoreTier(score: number) {
  if (score >= 9.0) return SCORE_TIERS.S;
  if (score >= 7.0) return SCORE_TIERS.A;
  if (score >= 5.0) return SCORE_TIERS.B;
  if (score >= 3.0) return SCORE_TIERS.C;
  return SCORE_TIERS.F;
}
