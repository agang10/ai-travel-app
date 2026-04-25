import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Types ────────────────────────────────────────────────
type TravelStyle = 'budget' | 'balanced' | 'luxury';

interface Activity {
  time: string;
  name: string;
  description: string;
  type: 'attraction' | 'food' | 'hotel' | 'experience';
  duration: string;
  cost: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  detailsUrl?: string;
}

interface DayPlan {
  day: number;
  theme: string;
  area: string;
  activities: Activity[];
}

interface Itinerary {
  destination: string;
  days: number;
  style: TravelStyle;
  overview: string;
  plans: DayPlan[];
}

// ─── Anthropic client ─────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Prompt builder ───────────────────────────────────────
function buildPrompt(
  destination: string,
  days: number,
  style: TravelStyle,
  arrivalDate?: string,
  arrivalTime?: string,
  departureDate?: string,
  departureTime?: string,
): string {
  const styleProfiles = {
    budget: {
      tone: 'savvy backpacker who knows how to travel well for less',
      accommodation: 'well-reviewed hostels, guesthouses, or budget boutique hotels under $80/night',
      food: 'street food stalls, local markets, neighbourhood eateries beloved by residents — never tourist traps',
      transport: 'public metro, buses, walking, and occasionally a cheap rideshare',
      experiences: 'free museums, public parks, free walking tours, viewpoints that cost nothing',
      costRange: 'activities under $20, meals under $15, avoid anything with a tourist premium',
    },
    balanced: {
      tone: 'knowledgeable friend who lives locally and has excellent taste without being extravagant',
      accommodation: 'charming mid-range hotels or boutique properties $100-250/night, well-located',
      food: 'a mix of celebrated local restaurants, buzzy neighbourhood spots, and one or two iconic splurges',
      transport: 'mix of metro, taxis, and walking — prioritise walkable neighbourhoods',
      experiences: 'paid attractions that are genuinely worth it, skip the ones that are not',
      costRange: 'activities $15-60, meals $20-60, one or two splurges are fine if justified',
    },
    luxury: {
      tone: 'private concierge at a five-star hotel with deep local connections',
      accommodation: 'iconic luxury hotels, design hotels, or boutique properties above $400/night with exceptional service',
      food: 'Michelin-starred restaurants, celebrated chef-driven spots, rooftop bars, private dining when possible',
      transport: 'private car transfers, premium taxis, never public transport unless it is itself an experience',
      experiences: 'private after-hours museum access, exclusive tours, skip-the-line everywhere, helicopter transfers if relevant',
      costRange: 'cost is secondary to quality — recommend the best available option unashamedly',
    },
  }[style];

  // ── Build timing context ───────────────────────────────
  let timingInstructions = '';

  if (arrivalTime || arrivalDate) {
    const arrivalHour = arrivalTime ? parseInt(arrivalTime.split(':')[0], 10) : null;
    const arrivalDateStr = arrivalDate
      ? new Date(arrivalDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : null;

    timingInstructions += '\n\nARRIVAL RULES (follow precisely):';

    if (arrivalDateStr) {
      timingInstructions += `\n- The traveller arrives on ${arrivalDateStr}.`;
    }

    if (arrivalHour !== null) {
      timingInstructions += `\n- Arrival time is ${arrivalTime}.`;

      if (arrivalHour >= 19) {
        timingInstructions += `
- Arrival is late evening (${arrivalTime}). Day 1 must contain ONLY:
  1. Hotel check-in
  2. A single dinner or drinks recommendation within walking distance of the hotel
  Do not schedule any sightseeing, attractions, or experiences on Day 1.`;
      } else if (arrivalHour >= 15) {
        timingInstructions += `
- Arrival is mid-to-late afternoon (${arrivalTime}). Day 1 must be light:
  1. Hotel check-in
  2. One nearby attraction or short walk (nothing requiring more than 1.5 hrs)
  3. Dinner
  Do not schedule morning activities on Day 1. Start the itinerary from ${arrivalTime} onwards.`;
      } else if (arrivalHour >= 12) {
        timingInstructions += `
- Arrival is around midday (${arrivalTime}). Day 1 starts at check-in.
  Skip morning activities. Begin with lunch, then 2-3 afternoon/evening activities.`;
      } else {
        timingInstructions += `
- Arrival is in the morning (${arrivalTime}). Day 1 can be a full day.
  Start with hotel check-in, then proceed with a normal full day itinerary from ${arrivalTime} onwards.`;
      }
    }
  }

  if (departureTime || departureDate) {
    const departureHour = departureTime ? parseInt(departureTime.split(':')[0], 10) : null;
    const departureDateStr = departureDate
      ? new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : null;

    timingInstructions += '\n\nDEPARTURE RULES (follow precisely):';

    if (departureDateStr) {
      timingInstructions += `\n- The traveller departs on ${departureDateStr}.`;
    }

    if (departureHour !== null) {
      timingInstructions += `\n- Departure time is ${departureTime}.`;

      if (departureHour < 12) {
        timingInstructions += `
- Departure is early morning (${departureTime}). The final day must contain ONLY:
  1. Breakfast at or near the hotel
  2. Hotel check-out
  Do not schedule any sightseeing on the final day. Remind the traveller to pack the night before.`;
      } else if (departureHour < 15) {
        timingInstructions += `
- Departure is around midday (${departureTime}). The final day should be very light:
  1. Hotel check-out
  2. A leisurely breakfast
  3. At most one brief, nearby activity that ends by ${Math.max(departureHour - 2, 9)}:00
  Choose only activities within 15 minutes of the hotel or airport route.`;
      } else {
        timingInstructions += `
- Departure is in the afternoon or evening (${departureTime}). The final day can include:
  1. Hotel check-out after breakfast
  2. Two or three light, nearby activities that wrap up by ${Math.max(departureHour - 3, 10)}:00
  3. A final lunch before heading to the airport/station
  Do not schedule anything requiring luggage storage or long transit times.`;
      }
    }
  }

  const timingSection = timingInstructions
    ? `\nTRIP TIMING:${timingInstructions}`
    : '\nTRIP TIMING:\n- No specific arrival or departure times provided. Generate a full itinerary with normal full-day pacing for all ${days} days.';

  return `You are a world-class travel curator — part Condé Nast Traveller editor, part local expert, part obsessive travel blogger. You have visited ${destination} multiple times and know it intimately: the hidden courtyards, the restaurant the locals queue for, the viewpoint that does not appear on any list, the exact table to request.

Generate a ${days}-day itinerary for ${destination} for a traveller with a ${style} travel style.

Your persona for this itinerary: ${styleProfiles.tone}.
${timingSection}

STYLE RULES — follow these without exception:
- Accommodation: ${styleProfiles.accommodation}
- Food: ${styleProfiles.food}
- Transport: ${styleProfiles.transport}
- Experiences: ${styleProfiles.experiences}
- Costs: ${styleProfiles.costRange}

QUALITY RULES:

1. SPECIFICITY: Name the exact street, stall, dish. Never say "explore the old town" — say which street, which corner, which hour.

2. THE WHY: Every activity needs a reason. Not just what it is, but why THIS place, why THIS time, why it is worth the traveller's hours.

3. INSIDER TIPS: Each description must include one specific insider detail — best time to avoid crowds, dish not on the English menu, where the photo actually looks good, entrance that skips the queue.

4. GEOGRAPHIC LOGIC: Each day must be geographically coherent. Activities within a day must be walkable or a very short ride apart. Never bounce across the city.

5. REAL PLACES ONLY: Every place must be a real, currently operating establishment. No invented names.

6. HUMAN VOICE: Write like a passionate well-travelled friend texting recommendations — specific, enthusiastic, occasionally opinionated. No brochure language.

7. PACING: Respect the timing rules above absolutely. If the timing rules say Day 1 is check-in and dinner only, that is all Day 1 contains.

RESPONSE FORMAT — return ONLY a single valid JSON object. No markdown, no backticks, no explanation, no text before or after:

{
  "destination": "${destination}",
  "days": ${days},
  "style": "${style}",
  "overview": "2-3 sentences in the voice of a passionate travel expert — specific to this destination and travel style",
  "plans": [
    {
      "day": 1,
      "theme": "Short evocative title naming the neighbourhood or mood",
      "area": "Primary neighbourhood or district for this day",
      "activities": [
        {
          "time": "09:00",
          "name": "Exact real name of the place",
          "description": "2-3 sentences: what it is, why unmissable, one insider tip",
          "type": "attraction | food | hotel | experience",
          "duration": "e.g. 1.5 hrs",
          "cost": "Exact cost with currency or Free",
          "lat": 0.000000,
          "lng": 0.000000,
          "imageUrl": "https://source.unsplash.com/featured/?${encodeURIComponent(destination)},travel",
          "detailsUrl": "official website URL or empty string"
        }
      ]
    }
  ]
}

FINAL CHECKS:
- Have you respected the arrival/departure timing rules exactly?
- Is every day geographically clustered?
- Are all lat/lng values accurate for the specific named place?
- Does the JSON have no trailing commas, no missing brackets?
- Is day 1 activity 1 a hotel check-in?
- Does every day include at least one food activity (unless timing makes it impossible)?

Return ONLY the JSON.`;
}

// ─── Generator ────────────────────────────────────────────
async function generateItinerary(
  destination: string,
  days: number,
  style: TravelStyle,
  arrivalDate?: string,
  arrivalTime?: string,
  departureDate?: string,
  departureTime?: string,
): Promise<Itinerary> {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: buildPrompt(destination, days, style, arrivalDate, arrivalTime, departureDate, departureTime),
      },
    ],
  });

  // Extract text content from response
  const rawText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Parse and return
  const itinerary: Itinerary = JSON.parse(cleaned);
  return itinerary;
}

// ─── Route handler ────────────────────────────────────────
// POST /api/itinerary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Validation ────────────────────────────────────────
    const { destination, days, style, arrivalDate, arrivalTime, departureDate, departureTime } = body;

    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
      return NextResponse.json(
        { error: 'destination is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!days || typeof days !== 'number' || days < 1 || days > 14) {
      return NextResponse.json(
        { error: 'days is required and must be a number between 1 and 14.' },
        { status: 400 }
      );
    }

    const validStyles: TravelStyle[] = ['budget', 'balanced', 'luxury'];
    if (!style || !validStyles.includes(style)) {
      return NextResponse.json(
        { error: `style is required and must be one of: ${validStyles.join(', ')}.` },
        { status: 400 }
      );
    }

    // ── Generate ──────────────────────────────────────────
    try {
      const itinerary = await generateItinerary(
  destination.trim(),
  days,
  style,
  arrivalDate || undefined,
  arrivalTime || undefined,
  departureDate || undefined,
  departureTime || undefined,
);
      return NextResponse.json(itinerary, { status: 200 });
    } catch (parseError) {
      console.error('[POST /api/itinerary] AI parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[POST /api/itinerary] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 500 }
    );
  }
}