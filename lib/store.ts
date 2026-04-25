export interface StoredItinerary {
  id: string;
  destination: string;
  days: number;
  style: string;
  overview: string;
  plans: any[];
  createdAt: string;
}

declare global {
  var itineraryStore: Record<string, StoredItinerary> | undefined;
}

const store = globalThis.itineraryStore ?? {};
globalThis.itineraryStore = store;

export function saveItinerary(itinerary: StoredItinerary): void {
  store[itinerary.id] = itinerary;
}

export function getItinerary(id: string): StoredItinerary | null {
  return store[id] ?? null;
}