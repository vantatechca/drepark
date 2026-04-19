import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { proTips, spots } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const PRO_TIPS_SEED = [
  {
    category: "parking" as const,
    title: "Always back in so the AMG badge faces the patio/terrace",
    description:
      "The badge is the conversation starter. When people see the AMG badge from their seats, it creates curiosity and opens doors for conversation. Always reverse into parking spots so the rear badge faces where people are sitting.",
  },
  {
    category: "car_care" as const,
    title: "Keep the car spotless",
    description:
      "A dirty AMG signals 'leveraged.' A clean one signals 'comfortable.' Weekly wash minimum, detail monthly. The car is your calling card — treat it like one.",
  },
  {
    category: "timing" as const,
    title: "Weekday daytime at a cafe with your laptop",
    description:
      "More powerful than Friday night on Crescent. It says 'I work for myself' without saying anything. A weekday afternoon at an independent cafe communicates success and independence better than any nightlife scene.",
  },
  {
    category: "parking" as const,
    title: "Small independent cafes with 3-4 parking spots out front are gold",
    description:
      "The car IS the only car people see. When there are only 3-4 spots and yours is the C63, it dominates the visual landscape. Big lots dilute the impact.",
  },
  {
    category: "networking" as const,
    title: "Brunch spots, ice cream shops, and wine bars with patios",
    description:
      "For meeting women: these spots work because the car sets a frame before you even open your mouth. The patio-adjacent parking means they see the car as they arrive and while they sit.",
  },
  {
    category: "networking" as const,
    title: "Car meets, upscale barbers, and cigar lounges for men",
    description:
      "Guys will approach you about the car directly. These environments create natural conversation starters and attract men who appreciate performance vehicles.",
  },
  {
    category: "parking" as const,
    title: "5-10 meter visibility maximum",
    description:
      "If the car is further than 10 meters from where people sit, the spot doesn't work. The magic distance is 5-10 meters — close enough to read the badge, close enough for the car to be part of the experience.",
  },
  {
    category: "parking" as const,
    title: "Avoid big parking lots at all costs",
    description:
      "The car becomes one of 200. You want it to be the ONLY car people notice. Never park in a large commercial lot when the goal is visibility.",
  },
  {
    category: "general" as const,
    title: "Chemin de Saint-Jean and Rue Victoria have the vibe",
    description:
      "Chemin de Saint-Jean in La Prairie and Rue Victoria in Saint-Lambert have that small-town patio-right-beside-the-car setup that makes the strategy work perfectly.",
  },
  {
    category: "general" as const,
    title: "Rotate spots — variety keeps it natural",
    description:
      "Don't become 'that guy who's always at Cafe X.' Maintain a rotation of 5-8 regular spots and mix in new discoveries. Variety prevents over-familiarity and keeps the impact fresh.",
  },
];

const SAMPLE_SPOTS = [
  {
    name: "Cafe Saint-Jean",
    spotType: "cafe" as const,
    address: "123 Chemin de Saint-Jean",
    city: "La Prairie",
    neighborhood: "Old Town La Prairie",
    zone: "south_shore_primary" as const,
    latitude: "45.4159",
    longitude: "-73.4987",
    parkingType: "street_front" as const,
    parkingSpotsCount: 4,
    distanceCarToSeatingM: 5,
    badgeVisible: true,
    backInPossible: true,
    terracePatio: true,
    laptopFriendly: true,
    priceRange: "$$" as const,
    audienceTags: ["business_networking", "young_professionals"],
    scoreProximity: 9,
    scoreVisibility: 9,
    scoreFootTraffic: 7,
    scoreVibe: 8,
    scoreNetworking: 7,
    scoreOverall: "8.1",
    status: "favorite" as const,
    discoverySource: "manual" as const,
    notes: "Perfect spot. 4 spots right out front, terrace is literally next to the car. Weekday mornings are golden.",
  },
  {
    name: "Glacier du Vieux La Prairie",
    spotType: "ice_cream" as const,
    address: "456 Rue Principale",
    city: "La Prairie",
    neighborhood: "Old Town La Prairie",
    zone: "south_shore_primary" as const,
    latitude: "45.4145",
    longitude: "-73.4973",
    parkingType: "street_side" as const,
    parkingSpotsCount: 3,
    distanceCarToSeatingM: 4,
    badgeVisible: true,
    backInPossible: true,
    terracePatio: true,
    laptopFriendly: false,
    priceRange: "$" as const,
    audienceTags: ["professional_women", "young_professionals"],
    scoreProximity: 10,
    scoreVisibility: 9,
    scoreFootTraffic: 8,
    scoreVibe: 8,
    scoreNetworking: 7,
    scoreOverall: "8.6",
    status: "verified" as const,
    discoverySource: "manual" as const,
    notes: "Ice cream terrace literally beside the parking. Summer evenings are packed with the right crowd.",
  },
  {
    name: "Le Brunch Victoria",
    spotType: "brunch" as const,
    address: "789 Rue Victoria",
    city: "Saint-Lambert",
    neighborhood: "Rue Victoria",
    zone: "south_shore_secondary" as const,
    latitude: "45.5003",
    longitude: "-73.5088",
    parkingType: "street_front" as const,
    parkingSpotsCount: 3,
    distanceCarToSeatingM: 6,
    badgeVisible: true,
    backInPossible: true,
    terracePatio: true,
    laptopFriendly: false,
    priceRange: "$$$" as const,
    audienceTags: ["professional_women", "brunch_crowd"],
    scoreProximity: 8,
    scoreVisibility: 8,
    scoreFootTraffic: 7,
    scoreVibe: 9,
    scoreNetworking: 8,
    scoreOverall: "8.0",
    status: "verified" as const,
    discoverySource: "manual" as const,
    notes: "Weekend brunch spot. Well-dressed crowd. Street parking right beside the patio.",
  },
];

async function seed() {
  console.log("Seeding DrePark database...");

  console.log("Inserting pro tips...");
  await db.insert(proTips).values(PRO_TIPS_SEED);
  console.log(`  Inserted ${PRO_TIPS_SEED.length} pro tips`);

  console.log("Inserting sample spots...");
  await db.insert(spots).values(SAMPLE_SPOTS);
  console.log(`  Inserted ${SAMPLE_SPOTS.length} sample spots`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
