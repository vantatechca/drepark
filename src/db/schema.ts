import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const spotTypeEnum = pgEnum("spot_type", [
  "cafe",
  "ice_cream",
  "brunch",
  "restaurant",
  "wine_bar",
  "barber",
  "cigar_lounge",
  "gym",
  "car_meet",
  "other",
]);

export const parkingTypeEnum = pgEnum("parking_type", [
  "street_front",
  "tiny_lot",
  "street_side",
  "shared_small_lot",
  "back_in_possible",
]);

export const priceRangeEnum = pgEnum("price_range", [
  "$",
  "$$",
  "$$$",
  "$$$$",
]);

export const spotStatusEnum = pgEnum("spot_status", [
  "suggested",
  "scouted",
  "verified",
  "favorite",
  "blacklisted",
]);

export const discoverySourceEnum = pgEnum("discovery_source", [
  "ai_suggested",
  "manual",
  "google_places",
]);

export const zoneEnum = pgEnum("zone", [
  "south_shore_primary",
  "south_shore_secondary",
  "montreal_occasional",
  "montreal_premium",
]);

export const timeSlotEnum = pgEnum("time_slot", [
  "early_morning",
  "morning",
  "lunch",
  "afternoon",
  "evening",
  "night",
]);

export const parkedWhereEnum = pgEnum("parked_where", [
  "ideal_spot",
  "acceptable",
  "had_to_park_far",
  "lot_full",
]);

export const crowdQualityEnum = pgEnum("crowd_quality", [
  "perfect",
  "good",
  "mediocre",
  "wrong_crowd",
  "empty",
]);

export const crowdGenderEnum = pgEnum("crowd_gender", [
  "mostly_men",
  "mostly_women",
  "mixed",
  "empty",
]);

export const whatIDidEnum = pgEnum("what_i_did", [
  "laptop_work",
  "coffee_hangout",
  "brunch",
  "ice_cream",
  "drinks",
  "just_parked",
  "meeting",
]);

export const weatherEnum = pgEnum("weather", [
  "sunny",
  "cloudy",
  "overcast",
  "rainy",
  "snowy",
  "cold",
  "hot",
]);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "interested",
  "scouted",
  "added",
  "rejected",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "phone",
  "instagram",
  "email",
  "business_card",
  "other",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const potentialEnum = pgEnum("potential", [
  "high",
  "medium",
  "low",
  "social_only",
]);

export const tipCategoryEnum = pgEnum("tip_category", [
  "parking",
  "networking",
  "car_care",
  "timing",
  "content",
  "general",
]);

export const recommendationTypeEnum = pgEnum("recommendation_type", [
  "go_now",
  "best_today",
  "weekly_plan",
  "new_spot_alert",
]);

// ============================================================
// TABLE 1: SPOTS
// ============================================================

export const spots = pgTable("spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 500 }).notNull(),
  spotType: spotTypeEnum("spot_type").notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }),
  zone: zoneEnum("zone").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  googlePlaceId: varchar("google_place_id", { length: 255 }),
  googleMapsUrl: varchar("google_maps_url", { length: 1000 }),
  websiteUrl: varchar("website_url", { length: 1000 }),
  phone: varchar("phone", { length: 50 }),
  parkingType: parkingTypeEnum("parking_type"),
  parkingSpotsCount: integer("parking_spots_count"),
  distanceCarToSeatingM: integer("distance_car_to_seating_m"),
  badgeVisible: boolean("badge_visible").default(false),
  backInPossible: boolean("back_in_possible").default(false),
  terracePatio: boolean("terrace_patio").default(false),
  laptopFriendly: boolean("laptop_friendly").default(false),
  hours: jsonb("hours").$type<Record<string, string>>(),
  priceRange: priceRangeEnum("price_range"),
  audienceTags: jsonb("audience_tags").$type<string[]>().default([]),
  streetViewImageUrl: varchar("street_view_image_url", { length: 1000 }),
  streetViewHeading: integer("street_view_heading").default(0),
  myPhotos: jsonb("my_photos")
    .$type<Array<{ url: string; caption: string; takenAt: string }>>()
    .default([]),
  scoreProximity: integer("score_proximity").default(0),
  scoreVisibility: integer("score_visibility").default(0),
  scoreFootTraffic: integer("score_foot_traffic").default(0),
  scoreVibe: integer("score_vibe").default(0),
  scoreNetworking: integer("score_networking").default(0),
  scoreOverall: decimal("score_overall", { precision: 3, scale: 1 }).default(
    "0.0"
  ),
  status: spotStatusEnum("status").default("suggested").notNull(),
  discoverySource: discoverySourceEnum("discovery_source").default("manual"),
  verificationNotes: text("verification_notes"),
  visitCount: integer("visit_count").default(0),
  lastVisitedAt: timestamp("last_visited_at"),
  bestTimes: jsonb("best_times").$type<Record<string, string[]>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 2: VISITS
// ============================================================

export const visits = pgTable("visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotId: uuid("spot_id")
    .references(() => spots.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  arrivedAt: time("arrived_at"),
  departedAt: time("departed_at"),
  durationMin: integer("duration_min"),
  dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
  timeSlot: timeSlotEnum("time_slot").notNull(),
  parkedWhere: parkedWhereEnum("parked_where"),
  badgeFacingCrowd: boolean("badge_facing_crowd").default(false),
  crowdQuality: crowdQualityEnum("crowd_quality"),
  crowdGender: crowdGenderEnum("crowd_gender"),
  conversationsCount: integer("conversations_count").default(0),
  contactsExchanged: integer("contacts_exchanged").default(0),
  carCompliments: integer("car_compliments").default(0),
  networkingRating: integer("networking_rating"),
  vibeRating: integer("vibe_rating"),
  contentCreated: boolean("content_created").default(false),
  whatIDid: whatIDidEnum("what_i_did"),
  notableInteractions: text("notable_interactions"),
  weather: weatherEnum("weather"),
  photos: jsonb("photos")
    .$type<Array<{ url: string; caption?: string }>>()
    .default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 3: SPOT SUGGESTIONS
// ============================================================

export const spotSuggestions = pgTable("spot_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  googlePlaceId: varchar("google_place_id", { length: 255 }),
  name: varchar("name", { length: 500 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  spotType: spotTypeEnum("spot_type"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  googleRating: decimal("google_rating", { precision: 3, scale: 1 }),
  googleReviewCount: integer("google_review_count"),
  streetViewUrl: varchar("street_view_url", { length: 1000 }),
  aiAssessment: text("ai_assessment"),
  aiParkingScoreEst: integer("ai_parking_score_est"),
  status: suggestionStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  suggestedAt: timestamp("suggested_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 4: TIMING DATA
// ============================================================

export const timingData = pgTable("timing_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotId: uuid("spot_id")
    .references(() => spots.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
  timeSlot: timeSlotEnum("time_slot").notNull(),
  visitCount: integer("visit_count").default(0),
  avgNetworkingRating: decimal("avg_networking_rating", {
    precision: 3,
    scale: 1,
  }),
  avgCrowdQuality: decimal("avg_crowd_quality", { precision: 3, scale: 1 }),
  avgConversations: decimal("avg_conversations", { precision: 3, scale: 1 }),
  parkingSuccessRate: decimal("parking_success_rate", {
    precision: 3,
    scale: 2,
  }),
  recommended: boolean("recommended").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 5: CONTACTS
// ============================================================

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitId: uuid("visit_id").references(() => visits.id, {
    onDelete: "set null",
  }),
  spotId: uuid("spot_id").references(() => spots.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  contactType: contactTypeEnum("contact_type").notNull(),
  contactValue: varchar("contact_value", { length: 500 }),
  gender: genderEnum("gender"),
  context: text("context"),
  potential: potentialEnum("potential").default("medium"),
  followedUp: boolean("followed_up").default(false),
  notes: text("notes"),
  metAt: timestamp("met_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 6: DISCOVERY SEARCHES
// ============================================================

export const discoverySearches = pgTable("discovery_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchQuery: varchar("search_query", { length: 500 }).notNull(),
  zone: varchar("zone", { length: 100 }),
  spotTypeFilter: varchar("spot_type_filter", { length: 100 }),
  resultsCount: integer("results_count").default(0),
  suggestionsCreated: integer("suggestions_created").default(0),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 7: PRO TIPS
// ============================================================

export const proTips = pgTable("pro_tips", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: tipCategoryEnum("category").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 8: ACTIVITY LOG
// ============================================================

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// TABLE 9: AI RECOMMENDATIONS
// ============================================================

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: recommendationTypeEnum("type").notNull(),
  spotId: uuid("spot_id").references(() => spots.id, { onDelete: "set null" }),
  reasoning: text("reasoning").notNull(),
  timeSlot: varchar("time_slot", { length: 50 }),
  audiencePrediction: varchar("audience_prediction", { length: 255 }),
  accepted: boolean("accepted"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// ============================================================
// RELATIONS
// ============================================================

export const spotsRelations = relations(spots, ({ many }) => ({
  visits: many(visits),
  timingData: many(timingData),
  contacts: many(contacts),
  aiRecommendations: many(aiRecommendations),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  spot: one(spots, { fields: [visits.spotId], references: [spots.id] }),
  contacts: many(contacts),
}));

export const timingDataRelations = relations(timingData, ({ one }) => ({
  spot: one(spots, { fields: [timingData.spotId], references: [spots.id] }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  visit: one(visits, { fields: [contacts.visitId], references: [visits.id] }),
  spot: one(spots, { fields: [contacts.spotId], references: [spots.id] }),
}));

export const aiRecommendationsRelations = relations(
  aiRecommendations,
  ({ one }) => ({
    spot: one(spots, {
      fields: [aiRecommendations.spotId],
      references: [spots.id],
    }),
  })
);
