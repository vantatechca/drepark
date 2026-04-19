import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function hasAIKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM_PROMPT = `You are the AI brain of DrePark, a strategic parking tool for a Mercedes C63 AMG owner in the South Shore Montreal area. Your job is to recommend the BEST spot to visit RIGHT NOW based on timing intelligence, visit history, and crowd patterns.

You have access to:
- All verified spots with their scores
- Timing data: which spots perform best at which day/time combinations
- Recent visit history (don't repeat)
- Current conditions: day, time, weather

Recommend the top 3 spots with reasoning. Be specific about WHY this time is good:
'Tuesday afternoon at Cafe X averages 3.2 conversations per visit and 4.1/5 networking rating. The brunch crowd is usually young professionals with disposable income.'

RULES:
- Never recommend blacklisted spots
- Prioritize S-Tier and A-Tier spots
- If timing data is thin (< 3 visits), say so: 'Limited data — worth testing'
- Consider parking success rate: don't send him somewhere where he'll end up in a big lot
- Always respond in valid JSON with this format:
{
  "recommendations": [
    {
      "spotId": "uuid",
      "spotName": "name",
      "reasoning": "detailed reasoning",
      "confidence": "high|medium|low",
      "expectedAudience": "description"
    }
  ],
  "insight": "overall timing insight for right now"
}`;

export async function getAIRecommendation(context: {
  dayOfWeek: string;
  timeSlot: string;
  currentTime: string;
  mood?: string;
  targetAudience?: string;
  spots: Array<{
    id: string;
    name: string;
    scoreOverall: number;
    spotType: string;
    zone: string;
    audienceTags: string[];
    timingData?: Array<{
      dayOfWeek: string;
      timeSlot: string;
      avgNetworkingRating: number;
      avgConversations: number;
      parkingSuccessRate: number;
    }>;
  }>;
  recentVisits: Array<{
    spotName: string;
    date: string;
    networkingRating: number;
  }>;
}): Promise<{
  recommendations: Array<{
    spotId: string;
    spotName: string;
    reasoning: string;
    confidence: string;
    expectedAudience: string;
  }>;
  insight: string;
} | null> {
  const ai = getClient();
  if (!ai) return null;

  const userMessage = `It's ${context.dayOfWeek} ${context.currentTime} (${context.timeSlot} time slot).${context.mood ? ` I want to ${context.mood}.` : ""}${context.targetAudience ? ` Target audience: ${context.targetAudience}.` : ""}

Available spots:
${JSON.stringify(context.spots, null, 2)}

Recent visits (last 5):
${JSON.stringify(context.recentVisits, null, 2)}

Where should I go?`;

  try {
    const response = await ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("AI recommendation error:", error);
    return null;
  }
}

export async function getAISpotAssessment(spot: {
  name: string;
  type: string;
  address: string;
  googleRating?: number;
  reviewCount?: number;
}): Promise<{ assessment: string; estimatedParkingScore: number } | null> {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system:
        "You assess potential parking spots for a Mercedes C63 AMG. The owner wants spots where the car has 5-10m visibility from seating areas. Small independent spots with 3-4 parking spaces are ideal. Big parking lots are bad. Respond in JSON: { \"assessment\": \"text\", \"estimatedParkingScore\": 1-10 }",
      messages: [
        {
          role: "user",
          content: `Assess this spot: ${spot.name} (${spot.type}) at ${spot.address}. Google rating: ${spot.googleRating || "N/A"}, Reviews: ${spot.reviewCount || "N/A"}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("AI assessment error:", error);
    return null;
  }
}
