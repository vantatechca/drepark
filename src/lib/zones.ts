export const ZONE_CENTERS = {
  south_shore_primary: { lat: 45.3876, lng: -73.5087 },
  south_shore_secondary: { lat: 45.5, lng: -73.51 },
  montreal_occasional: { lat: 45.49, lng: -73.565 },
  montreal_premium: { lat: 45.5075, lng: -73.553 },
} as const;

export const ZONES = {
  south_shore_primary: {
    label: "South Shore Primary",
    cities: [
      "La Prairie",
      "Sainte-Catherine",
      "Saint-Constant",
      "Kahnawake",
      "Châteauguay",
    ],
    priority: "Highest",
    description:
      "Daily spots. Small-town patio-beside-car vibe.",
  },
  south_shore_secondary: {
    label: "South Shore Secondary",
    cities: ["Saint-Lambert", "Vieux-Longueuil"],
    priority: "Medium",
    description:
      "Great brunch/patio strips. Worth the drive for quality spots.",
  },
  montreal_occasional: {
    label: "Montreal Occasional",
    cities: ["Griffintown", "Verdun"],
    priority: "Low-Medium",
    description:
      "Tight street parking beside patios. Trendy crowd. 1-2x/week max.",
  },
  montreal_premium: {
    label: "Montreal Premium",
    cities: ["Old Port"],
    priority: "Low",
    description:
      "Street parking beside terraces. Maximum visibility. Special occasions.",
  },
} as const;

export type ZoneKey = keyof typeof ZONES;

// Google Places search queries for discovery
export const SEARCH_QUERIES = [
  { type: "cafe", keyword: "independent cafe patio" },
  { type: "cafe", keyword: "small cafe terrace" },
  { type: "restaurant", keyword: "brunch spot patio" },
  { type: "food", keyword: "ice cream shop" },
  { type: "food", keyword: "gelato terrace" },
  { type: "bar", keyword: "wine bar patio" },
  { type: "bar", keyword: "cocktail bar terrace" },
  { type: "hair_care", keyword: "upscale barber shop" },
  { type: "gym", keyword: "boutique fitness studio" },
  { type: "cafe", keyword: "cigar lounge" },
] as const;
