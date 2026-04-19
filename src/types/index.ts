import type { spots, visits, spotSuggestions, contacts, timingData, proTips, aiRecommendations } from "@/db/schema";

// Infer types from Drizzle schema
export type Spot = typeof spots.$inferSelect;
export type NewSpot = typeof spots.$inferInsert;

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

export type SpotSuggestion = typeof spotSuggestions.$inferSelect;
export type NewSpotSuggestion = typeof spotSuggestions.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type TimingData = typeof timingData.$inferSelect;

export type ProTip = typeof proTips.$inferSelect;

export type AIRecommendation = typeof aiRecommendations.$inferSelect;

// Extended types with relations
export type SpotWithVisits = Spot & {
  visits: Visit[];
};

export type VisitWithSpot = Visit & {
  spot: Spot;
};

export type ContactWithRelations = Contact & {
  spot?: Spot;
  visit?: Visit;
};

// Form data types
export type SpotFormData = {
  name: string;
  spotType: string;
  address: string;
  city: string;
  neighborhood?: string;
  zone: string;
  latitude: string;
  longitude: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  phone?: string;
  parkingType?: string;
  parkingSpotsCount?: number;
  distanceCarToSeatingM?: number;
  badgeVisible: boolean;
  backInPossible: boolean;
  terracePatio: boolean;
  laptopFriendly: boolean;
  priceRange?: string;
  audienceTags: string[];
  streetViewHeading?: number;
  scoreProximity: number;
  scoreVisibility: number;
  scoreFootTraffic: number;
  scoreVibe: number;
  scoreNetworking: number;
  status: string;
  notes?: string;
};

export type VisitFormData = {
  spotId: string;
  date: string;
  arrivedAt?: string;
  departedAt?: string;
  timeSlot: string;
  parkedWhere?: string;
  badgeFacingCrowd: boolean;
  crowdQuality?: string;
  crowdGender?: string;
  conversationsCount: number;
  contactsExchanged: number;
  carCompliments: number;
  networkingRating?: number;
  vibeRating?: number;
  contentCreated: boolean;
  whatIDid?: string;
  notableInteractions?: string;
  weather?: string;
  notes?: string;
};

// Analytics types
export type SpotAnalytics = {
  totalVisits: number;
  avgNetworkingRating: number;
  avgConversations: number;
  totalContacts: number;
  contactsPerVisit: number;
  bestTimeSlot?: string;
  bestDay?: string;
};

export type MonthlyStats = {
  totalVisits: number;
  totalConversations: number;
  totalContacts: number;
  avgNetworkingRating: number;
  prevMonthVisits: number;
  prevMonthConversations: number;
  prevMonthContacts: number;
};
