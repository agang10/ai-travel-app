import { NextRequest, NextResponse } from 'next/server';
import { getItinerary } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const itinerary = getItinerary(id);

  if (!itinerary) {
    return NextResponse.json(
      { error: 'Itinerary not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json(itinerary, { status: 200 });
}