import { NextRequest, NextResponse } from 'next/server';
import { saveItinerary } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.destination || !body.plans) {
      return NextResponse.json(
        { error: 'Invalid itinerary data.' },
        { status: 400 }
      );
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    saveItinerary({
      id,
      destination: body.destination,
      days: body.days,
      style: body.style,
      overview: body.overview,
      plans: body.plans,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/itinerary/save] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save itinerary.' },
      { status: 500 }
    );
  }
}