'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────
type TravelStyle = 'budget' | 'balanced' | 'luxury';

interface Activity {
  time: string;
  name: string;
  description: string;
  type: 'attraction' | 'food' | 'hotel' | 'experience';
  duration: string;
  cost: string;
  lat?: number;
  lng?: number;
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

// ─── Mock data ────────────────────────────────────────────
const MOCK_ITINERARY: Itinerary = {
  destination: 'Kyoto, Japan',
  days: 3,
  style: 'balanced',
  overview:
    'Three days of temple mornings, artisan afternoons, and lantern-lit evenings — clustered by neighbourhood to eliminate backtracking.',
  plans: [
    {
      day: 1,
      theme: 'Eastern Temples & Geisha District',
      area: 'Higashiyama',
      activities: [
        { time: '08:00', name: 'Fushimi Inari Taisha', description: "Walk the lower torii gates before crowds arrive.", type: 'attraction', duration: '2 hrs', cost: 'Free', lat: 34.9671, lng: 135.7727 },
        { time: '10:30', name: 'Kiyomizudera Temple', description: "Perched on a forested hillside with sweeping city views.", type: 'attraction', duration: '1.5 hrs', cost: '¥500', lat: 34.9948, lng: 135.7851 },
        { time: '13:00', name: 'Lunch at Kagizen Yoshifusa', description: "Kyoto's oldest sweets shop serving kaiseki-lite lunch sets.", type: 'food', duration: '1 hr', cost: '¥2,200', lat: 35.0037, lng: 135.7754 },
        { time: '15:00', name: 'Gion District walk', description: "Wander Hanamikoji Street at golden hour.", type: 'experience', duration: '2 hrs', cost: 'Free', lat: 35.0037, lng: 135.7780 },
        { time: '19:00', name: 'Dinner at Nakamura', description: "A 500-year-old kaiseki institution.", type: 'food', duration: '2 hrs', cost: '¥8,000', lat: 35.0050, lng: 135.7700 },
      ],
    },
    {
      day: 2,
      theme: 'Zen Gardens & Bamboo',
      area: 'Arashiyama & Nishiki',
      activities: [
        { time: '07:30', name: 'Bamboo Grove, Arashiyama', description: "The light before 8am is extraordinary.", type: 'attraction', duration: '45 min', cost: 'Free', lat: 35.0170, lng: 135.6720 },
        { time: '09:00', name: 'Tenryuji Garden', description: "A UNESCO World Heritage dry garden designed in 1339.", type: 'attraction', duration: '1.5 hrs', cost: '¥500', lat: 35.0153, lng: 135.6748 },
        { time: '12:00', name: 'Nishiki Market', description: "Kyoto's kitchen — 400 metres of street food vendors.", type: 'food', duration: '1.5 hrs', cost: '¥1,500', lat: 35.0052, lng: 135.7659 },
        { time: '15:00', name: 'Nijo Castle', description: "The nightingale floors were designed to squeak as a security system.", type: 'attraction', duration: '1.5 hrs', cost: '¥1,000', lat: 35.0142, lng: 135.7480 },
        { time: '20:00', name: 'Pontocho Alley', description: "A lantern-lit alley of izakayas along the Kamo River.", type: 'food', duration: '2 hrs', cost: '¥3,500', lat: 35.0060, lng: 135.7700 },
      ],
    },
    {
      day: 3,
      theme: "Gold Pavilion & Philosopher's Path",
      area: "Kinkakuji & Philosopher's Path",
      activities: [
        { time: '09:00', name: 'Kinkakuji (Golden Pavilion)', description: "The reflection in Kyoko-chi pond on a clear morning is flawless.", type: 'attraction', duration: '1 hr', cost: '¥500', lat: 35.0394, lng: 135.7292 },
        { time: '11:00', name: "Philosopher's Path", description: "A 2km canal-side walk connecting Ginkakuji to Nanzenji.", type: 'experience', duration: '1.5 hrs', cost: 'Free', lat: 35.0270, lng: 135.7937 },
        { time: '13:00', name: 'Omen Noodles', description: "Handmade udon in a low-lit wooden house near Ginkakuji.", type: 'food', duration: '1 hr', cost: '¥1,400', lat: 35.0260, lng: 135.7950 },
        { time: '15:00', name: 'Nanzenji Temple & Aqueduct', description: "Meiji-era red brick aqueduct inside an ancient Zen complex.", type: 'attraction', duration: '1.5 hrs', cost: '¥600', lat: 35.0116, lng: 135.7933 },
      ],
    },
  ],
};

// ─── Component helpers ────────────────────────────────────
const TYPE_CONFIG = {
  attraction: { label: 'Attraction', color: '#0f6e56', bg: '#e1f5ee' },
  food:        { label: 'Food & Drink', color: '#7c4f0a', bg: '#fef3c7' },
  hotel:       { label: 'Stay',        color: '#1e429f', bg: '#ebf5fb' },
  experience:  { label: 'Experience',  color: '#6b21a8', bg: '#f3e8ff' },
};

const STYLES: { value: TravelStyle; label: string; sub: string }[] = [
  { value: 'budget',   label: 'Budget',   sub: 'Smart & savvy'   },
  { value: 'balanced', label: 'Balanced', sub: 'Best of both'    },
  { value: 'luxury',   label: 'Luxury',   sub: 'No compromise'   },
];

const SUGGESTIONS = [
  'Kyoto, Japan', 'Lisbon, Portugal', 'Oaxaca, Mexico',
  'Copenhagen, Denmark', 'Marrakech, Morocco', 'Tbilisi, Georgia',
  'Dubrovnik, Croatia', 'Chiang Mai, Thailand',
];

// ─── Page ─────────────────────────────────────────────────
// ── Map component (Leaflet, loaded dynamically to avoid SSR errors) ──────────
import dynamic from 'next/dynamic';

const DAY_COLORS = ['#d97706', '#0f6e56', '#1e429f', '#6b21a8', '#be123c'];

function MapPanel({ itinerary, activeDay }: { itinerary: Itinerary; activeDay: number | null }) {
  const mapRef = useRef<any>(null);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Leaflet only on the client (avoids SSR crash)
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([L, RL]) => {
      // Fix default marker icon broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletComponents({ L, ...RL });
    });
  }, []);

  if (!LeafletComponents) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef' }}>
        <span style={{ fontSize: 13, color: '#8a8480' }}>Loading map…</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup } = LeafletComponents;

  // Collect all pins, filtered by active day
  const days = activeDay ? itinerary.plans.filter(p => p.day === activeDay) : itinerary.plans;

  // Find map centre from all visible pins
  const allPins = days.flatMap(p => p.activities.filter(a => a.lat && a.lng));
  const centerLat = allPins.reduce((s, a) => s + a.lat!, 0) / (allPins.length || 1);
  const centerLng = allPins.reduce((s, a) => s + a.lng!, 0) / (allPins.length || 1);

  return (
    <MapContainer
      center={[centerLat || 35.0, centerLng || 135.75]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {days.map((plan, di) => {
        const color = DAY_COLORS[di % DAY_COLORS.length];
        const pins = plan.activities.filter(a => a.lat && a.lng);
        const positions = pins.map(a => [a.lat!, a.lng!] as [number, number]);

        return (
          <div key={plan.day}>
            {/* Route line */}
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 2.5, opacity: 0.7, dashArray: '6 4' }}
              />
            )}
            {/* Activity pins */}
            {pins.map((act, ai) => (
  <CircleMarker
    key={ai}
    center={[act.lat!, act.lng!]}
    radius={8}
    pathOptions={{
      fillColor: color,
      color: '#fff',
      weight: 2,
      fillOpacity: 0.95,
    }}
  >
    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 500 }}>{act.name}</div>
        <div style={{ color: '#6b6760' }}>{act.time} · {act.duration}</div>
      </div>
    </Tooltip>

    <Popup offset={[0, -6]} maxWidth={280} className="wayfarer-popup">
      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          width: 260,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          margin: -14,
        }}
      >
        {act.imageUrl && (
          <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
            <img
              src={act.imageUrl}
              alt={act.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color,
                background: `${color}18`,
                padding: '2px 8px',
                borderRadius: 99,
              }}
            >
              {act.type}
            </span>
            <span style={{ fontSize: 11, color: '#8a8480' }}>{act.time}</span>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>
            {act.name}
          </div>

          <div style={{ fontSize: 12, color: '#6b6760', lineHeight: 1.6, marginBottom: 10 }}>
            {act.description}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14, paddingTop: 10, borderTop: '1px solid #f0ede8' }}>
            <div>
              <div style={{ fontSize: 10, color: '#a09c96', textTransform: 'uppercase' }}>Duration</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{act.duration}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#a09c96', textTransform: 'uppercase' }}>Cost</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{act.cost}</div>
            </div>
          </div>

          <a
            href={act.detailsUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!act.detailsUrl) e.preventDefault();
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 0',
              background: '#1a1714',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
              borderRadius: 8,
              textDecoration: 'none',
              opacity: act.detailsUrl ? 1 : 0.45,
              cursor: act.detailsUrl ? 'pointer' : 'default',
            }}
          >
            {act.detailsUrl ? 'Learn more ↗' : 'Book this — coming soon'}
          </a>
        </div>
      </div>
    </Popup>
  </CircleMarker>
))}
          </div>
        );
      })}
    </MapContainer>
  );
}
export default function Page() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [style, setStyle] = useState<TravelStyle>('balanced');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [mounted, setMounted] = useState(false);
  const [showMap, setShowMap] = useState(false);
const [activeMapDay, setActiveMapDay] = useState<number | null>(null);
const [arrivalDate, setArrivalDate] = useState('');
const [arrivalTime, setArrivalTime] = useState('');
const [departureDate, setDepartureDate] = useState('');
const [departureTime, setDepartureTime] = useState('');
const [savedId, setSavedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const onDestChange = (v: string) => {
    setDestination(v);
    if (v.length > 0) {
      setSuggestions(SUGGESTIONS.filter(s => s.toLowerCase().includes(v.toLowerCase())));
      setShowSug(true);
    } else {
      setShowSug(false);
    }
  };

  const pickSuggestion = (s: string) => {
    setDestination(s);
    setShowSug(false);
    inputRef.current?.blur();
  };

  const toggleDay = (d: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const generate = async () => {
  if (!destination.trim()) return;
  setStatus('loading');
  setItinerary(null);

  try {
  const res = await fetch('/api/itinerary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
  destination,
  days,
  style,
  arrivalDate: arrivalDate || undefined,
  arrivalTime: arrivalTime || undefined,
  departureDate: departureDate || undefined,
  departureTime: departureTime || undefined,
}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate itinerary');
  }

  // Save to memory store and get shareable ID
  const saveRes = await fetch('/api/itinerary/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const saveData = await saveRes.json();
  if (saveData.id) setSavedId(saveData.id);

  setItinerary(data);
  setExpandedDays(new Set([1]));
  setStatus('done');
} catch (error) {
  console.error(error);
  setStatus('idle');
}
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sand: #faf9f6;
          --sand-2: #f3f1ec;
          --sand-3: #e8e4dc;
          --sand-4: #d4cfc4;
          --ink: #1a1714;
          --ink-2: #4a4540;
          --ink-3: #8a8480;
          --amber: #d97706;
          --amber-light: #fef3c7;
          --amber-dark: #92400e;
          --white: #ffffff;
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 20px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
          --shadow-lg: 0 8px 30px rgba(0,0,0,0.09), 0 3px 8px rgba(0,0,0,0.05);
          --font-serif: 'Lora', Georgia, serif;
          --font-sans: 'DM Sans', system-ui, sans-serif;
          --transition: 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }

        html, body { height: 100%; background: var(--sand); font-family: var(--font-sans); color: var(--ink); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--sand-4); border-radius: 4px; }

        /* Input */
        .wp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid var(--sand-3);
          border-radius: var(--radius-md);
          background: var(--white);
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--ink);
          transition: border-color var(--transition), box-shadow var(--transition);
          outline: none;
        }
        .wp-input::placeholder { color: var(--ink-3); }
        .wp-input:focus { border-color: var(--amber); box-shadow: 0 0 0 3px rgba(217,119,6,0.12); }

        /* Button */
        .wp-btn-primary {
          width: 100%;
          padding: 13px 20px;
          background: var(--ink);
          color: var(--white);
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background var(--transition), transform var(--transition), opacity var(--transition);
          letter-spacing: 0.01em;
        }
        .wp-btn-primary:hover:not(:disabled) { background: #2c2720; }
        .wp-btn-primary:active:not(:disabled) { transform: scale(0.985); }
        .wp-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Style selector */
        .wp-style-btn {
          flex: 1;
          padding: 10px 8px;
          border: 1px solid var(--sand-3);
          border-radius: var(--radius-md);
          background: var(--white);
          cursor: pointer;
          text-align: center;
          transition: all var(--transition);
          font-family: var(--font-sans);
        }
        .wp-style-btn:hover { border-color: var(--sand-4); }
        .wp-style-btn.active { border-color: var(--amber); background: var(--amber-light); }

        /* Stepper */
        .wp-stepper-btn {
          width: 34px;
          height: 34px;
          border: 1px solid var(--sand-3);
          border-radius: var(--radius-sm);
          background: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          color: var(--ink-2);
          transition: all var(--transition);
          flex-shrink: 0;
        }
        .wp-stepper-btn:hover { border-color: var(--sand-4); background: var(--sand-2); }
        .wp-stepper-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Day card */
        .wp-day-card {
          border: 1px solid var(--sand-3);
          border-radius: var(--radius-lg);
          background: var(--white);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          animation: fadeSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .wp-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          cursor: pointer;
          background: var(--sand);
          border-bottom: 1px solid transparent;
          transition: background var(--transition);
          user-select: none;
        }
        .wp-day-header:hover { background: var(--sand-2); }
        .wp-day-header.open { border-bottom-color: var(--sand-3); }

        /* Activity */
        .wp-activity {
          display: flex;
          gap: 14px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--sand-2);
          transition: background var(--transition);
        }
        .wp-activity:last-child { border-bottom: none; }
        .wp-activity:hover { background: #fdfcfb; }

        /* Skeleton */
        .wp-skeleton {
          background: linear-gradient(90deg, var(--sand-2) 25%, var(--sand-3) 50%, var(--sand-2) 75%);
          background-size: 400px 100%;
          animation: shimmer 1.6s infinite;
          border-radius: 6px;
        }

        /* Suggestion list */
        .wp-suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0; right: 0;
          background: var(--white);
          border: 1px solid var(--sand-3);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          z-index: 50;
          overflow: hidden;
        }
        .wp-sug-item {
          padding: 9px 14px;
          font-size: 13px;
          color: var(--ink-2);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background var(--transition);
        }
        .wp-sug-item:hover { background: var(--sand); }

        /* Chip / badge */
        .wp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Animations */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .spin { animation: spin 0.9s linear infinite; }
        .pulse { animation: pulse 1.8s ease-in-out infinite; }

        /* Fade-in for the whole result block */
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.4s ease both; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ────────────────────────────────── */}
        <aside style={{
          width: 340,
          flexShrink: 0,
          background: 'var(--white)',
          borderRight: '1px solid var(--sand-3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Brand strip */}
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 0.5L7.5 4.5H11.5L8.25 7L9.5 11L6 8.75L2.5 11L3.75 7L0.5 4.5H4.5L6 0.5Z" fill="white"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                Itinera
              </span>
            </div>
          </div>

          {/* Form scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.3,
                color: 'var(--ink)',
                marginBottom: 8,
              }}>
                Where are you<br />
                <em style={{ color: 'var(--amber)' }}>headed next?</em>
              </h1>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                Plan a perfect trip in seconds — route-optimised, day by day.
              </p>
            </div>

            {/* ── FIELDS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Destination */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                  Destination
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    className="wp-input"
                    placeholder="City, country…"
                    value={destination}
                    onChange={e => onDestChange(e.target.value)}
                    onFocus={() => destination && setShowSug(true)}
                    onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  />
                  {showSug && suggestions.length > 0 && (
                    <div className="wp-suggestions">
                      {suggestions.slice(0, 5).map(s => (
                        <div key={s} className="wp-sug-item" onMouseDown={() => pickSuggestion(s)}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
                            <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5C2.5 7.125 6 11 6 11C6 11 9.5 7.125 9.5 4.5C9.5 2.567 7.933 1 6 1ZM6 5.75C5.31 5.75 4.75 5.19 4.75 4.5C4.75 3.81 5.31 3.25 6 3.25C6.69 3.25 7.25 3.81 7.25 4.5C7.25 5.19 6.69 5.75 6 5.75Z" fill="currentColor"/>
                          </svg>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Quick picks */}
                {!destination && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {SUGGESTIONS.slice(0, 4).map(s => (
                      <button
                        key={s}
                        onClick={() => setDestination(s)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 99,
                          border: '1px solid var(--sand-3)',
                          background: 'transparent',
                          fontSize: 12,
                          color: 'var(--ink-3)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--sand-4)'; (e.target as HTMLButtonElement).style.color = 'var(--ink-2)'; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--sand-3)'; (e.target as HTMLButtonElement).style.color = 'var(--ink-3)'; }}
                      >
                        {s.split(',')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                  Duration
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="wp-stepper-btn" onClick={() => setDays(d => Math.max(1, d - 1))} disabled={days <= 1}>−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>{days}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 5 }}>{days === 1 ? 'day' : 'days'}</span>
                  </div>
                  <button className="wp-stepper-btn" onClick={() => setDays(d => Math.min(14, d + 1))} disabled={days >= 14}>+</button>
                </div>
                <input
                  type="range" min={1} max={14} value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 10, accentColor: 'var(--amber)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
                  <span>1 day</span><span>14 days</span>
                </div>
              </div>

              {/* Travel style */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                  Travel style
                </label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {STYLES.map(s => (
                    <button
                      key={s.value}
                      className={`wp-style-btn${style === s.value ? ' active' : ''}`}
                      onClick={() => setStyle(s.value)}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: style === s.value ? 'var(--amber-dark)' : 'var(--ink)', marginBottom: 2 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: style === s.value ? '#92400e99' : 'var(--ink-3)' }}>
                        {s.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

{/* Trip timing */}
<div>
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 500,
    color: 'var(--ink-3)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 4,
  }}>
    Trip timing <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
  </label>
  <p style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10, lineHeight: 1.5 }}>
    Add arrival and departure details for a more precise plan.
  </p>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

    {/* Arrival row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <div>
        <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>
          Arrival date
        </label>
        <input
          type="date"
          value={arrivalDate}
          onChange={e => setArrivalDate(e.target.value)}
          className="wp-input"
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>
          Arrival time
        </label>
        <input
          type="time"
          value={arrivalTime}
          onChange={e => setArrivalTime(e.target.value)}
          className="wp-input"
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
      </div>
    </div>

    {/* Departure row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <div>
        <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>
          Departure date
        </label>
        <input
          type="date"
          value={departureDate}
          onChange={e => setDepartureDate(e.target.value)}
          className="wp-input"
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>
          Departure time
        </label>
        <input
          type="time"
          value={departureTime}
          onChange={e => setDepartureTime(e.target.value)}
          className="wp-input"
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
      </div>
    </div>

  </div>
</div>

{/* CTA */}
<div style={{ marginTop: 4 }}></div>

              {/* CTA */}
              <div style={{ marginTop: 4 }}>
                <button
                  className="wp-btn-primary"
                  disabled={!mounted || !destination.trim() || status === 'loading'}
                  onClick={generate}
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
                        <path d="M7 1.5C10.038 1.5 12.5 3.962 12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Generating itinerary…
                    </>
                  ) : (
                    <>
                      Generate itinerary
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2.5 6.5H10.5M7 3L10.5 6.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel footer */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--sand-3)', flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              Powered by Claude AI · Route-optimised
            </p>
          </div>
        </aside>

        {/* ── RIGHT PANEL ───────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--sand)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 32px 60px' }}>

            {/* ── EMPTY STATE ── */}
            {status === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  border: '1px solid var(--sand-3)',
                  background: 'var(--white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="var(--sand-4)" strokeWidth="1.2"/>
                    <path d="M10 14C10 11.791 11.791 10 14 10C16.209 10 18 11.791 18 14" stroke="var(--sand-4)" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="14" cy="14" r="2" fill="var(--ink-3)"/>
                    <path d="M6 8L7.5 6.5M20 20L21.5 21.5M6 20L7.5 21.5M20 8L21.5 6.5" stroke="var(--sand-4)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
                  Your itinerary will appear here
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 300, lineHeight: 1.7 }}>
                  Enter your destination and preferences, then click Generate to build a day-by-day plan.
                </p>
                {/* Feature row */}
                <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                  {[
                    { icon: '◎', title: 'Route optimised', desc: 'Daily geo-clusters' },
                    { icon: '◈', title: 'Time-blocked', desc: 'AM · PM · Evening' },
                    { icon: '◇', title: 'Bookable-ready', desc: 'Affiliate hooks built in' },
                  ].map(f => (
                    <div key={f.title} style={{
                      flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--white)', border: '1px solid var(--sand-3)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 16, color: 'var(--ink-3)', marginBottom: 6 }}>{f.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LOADING STATE ── */}
            {status === 'loading' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Generating optimised itinerary…</span>
                </div>
                {/* Skeleton cards */}
                {[1, 2].map(i => (
                  <div key={i} className="wp-day-card" style={{ marginBottom: 12 }}>
                    <div style={{ padding: '14px 18px', background: 'var(--sand)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="wp-skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
                      <div style={{ flex: 1 }}>
                        <div className="wp-skeleton" style={{ width: 140, height: 13, marginBottom: 6 }} />
                        <div className="wp-skeleton" style={{ width: 90, height: 11 }} />
                      </div>
                    </div>
                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[1, 2, 3].map(j => (
                        <div key={j} style={{ display: 'flex', gap: 12 }}>
                          <div className="wp-skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div className="wp-skeleton" style={{ width: '60%', height: 13, marginBottom: 7 }} />
                            <div className="wp-skeleton" style={{ width: '90%', height: 11, marginBottom: 5 }} />
                            <div className="wp-skeleton" style={{ width: '70%', height: 11 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── RESULTS ── */}
            {status === 'done' && itinerary && (
              <div className="fade-in">
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {itinerary.days} {itinerary.days === 1 ? 'day' : 'days'} in{' '}
                      <em style={{ color: 'var(--amber)' }}>{itinerary.destination}</em>
                    </h2>
                    <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                      <button
  onClick={() => setShowMap(v => !v)}
  style={{
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--sand-3)',
    background: showMap ? 'var(--ink)' : 'var(--white)',
    color: showMap ? 'var(--white)' : 'var(--ink-2)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s ease',
  }}
>
  {showMap ? 'Hide map' : 'Show map'}
</button>
                      {savedId && (
  <a
    href={`/itinerary/${savedId}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding: '6px 12px',
      borderRadius: 8,
      border: '1px solid var(--sand-3)',
      background: 'var(--ink)',
      color: 'white',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      textDecoration: 'none',
      display: 'inline-block',
    }}
  >
    Share
  </a>
)}

<button
  style={{
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--sand-3)',
    background: 'var(--white)',
    fontSize: 12,
    color: 'var(--ink-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  }}
>
  Save
</button>
                    </div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--amber-light)', color: 'var(--amber-dark)', fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                    {itinerary.style.charAt(0).toUpperCase() + itinerary.style.slice(1)}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>{itinerary.overview}</p>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--sand-3)' }}>
                    {[
                      { label: 'Days', value: itinerary.days },
                      { label: 'Activities', value: itinerary.plans.reduce((s, p) => s + p.activities.length, 0) },
                      { label: 'Neighbourhoods', value: itinerary.plans.length },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink)' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {itinerary.plans.map((plan, pi) => {
                    const open = expandedDays.has(plan.day);
                    return (
                      <div key={plan.day} className="wp-day-card" style={{ animationDelay: `${pi * 55}ms` }}>

                        {/* Day header */}
                        <div
                          className={`wp-day-header${open ? ' open' : ''}`}
                          onClick={() => toggleDay(plan.day)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 8,
                              background: 'var(--ink)', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 500, flexShrink: 0,
                            }}>
                              {plan.day}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{plan.theme}</div>
                              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{plan.area}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{plan.activities.length} stops</span>
                            <svg
                              width="14" height="14" viewBox="0 0 14 14" fill="none"
                              style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
                            >
                              <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                        {/* Activities */}
                        {open && (
                          <div>
                            {plan.activities.map((act, ai) => {
                              const cfg = TYPE_CONFIG[act.type];
                              return (
                                <div key={ai} className="wp-activity">
                                  {/* Time column */}
                                  <div style={{ flexShrink: 0, width: 38, paddingTop: 2 }}>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{act.time}</div>
                                  </div>

                                  {/* Content */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                                          <span
                                            className="wp-badge"
                                            style={{ background: cfg.bg, color: cfg.color }}
                                          >
                                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                                            {cfg.label}
                                          </span>
                                          <span style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.9"/>
                                              <path d="M5 3V5.2L6.2 6.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                                            </svg>
                                            {act.duration}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 5 }}>{act.name}</div>
                                        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>{act.description}</div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>{act.cost}</div>
                                      </div>

                                      {/* Book button — affiliate hook */}
                                      <button
                                        style={{
                                          flexShrink: 0, padding: '4px 10px',
                                          borderRadius: 7, border: '1px solid var(--sand-3)',
                                          background: 'transparent', fontSize: 11,
                                          color: 'var(--ink-3)', cursor: 'pointer',
                                          fontFamily: 'var(--font-sans)',
                                          opacity: 0,
                                          transition: 'opacity var(--transition)',
                                        }}
                                        onMouseEnter={e => {
                                          (e.currentTarget.parentElement!.parentElement!).style.background = '#fdfcfb';
                                          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                                        }}
                                        onFocus={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                                        onBlur={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
                                        className="book-btn"
                                      >
                                        Book ↗
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer note */}
                <div style={{ marginTop: 28, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    Route-optimised · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Affiliate links coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* ── MAP PANEL ── */}
{showMap && itinerary && (
  <div style={{
    position: 'fixed', top: 0, right: 0,
    width: 'calc(100vw - 340px)', height: '100vh',
    zIndex: 100, display: 'flex', flexDirection: 'column',
    background: 'var(--white)',
    borderLeft: '1px solid var(--sand-3)',
  }}>
    {/* Map toolbar */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 16px',
      borderBottom: '1px solid var(--sand-3)',
      background: 'var(--white)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginRight: 4 }}>
        Route map
      </span>
      {/* Day filter pills */}
      <button
        onClick={() => setActiveMapDay(null)}
        style={{
          padding: '3px 10px', borderRadius: 99, fontSize: 12,
          border: '1px solid var(--sand-3)',
          background: activeMapDay === null ? 'var(--ink)' : 'transparent',
          color: activeMapDay === null ? 'var(--white)' : 'var(--ink-3)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}
      >
        All days
      </button>
      {itinerary.plans.map((plan, i) => (
        <button
          key={plan.day}
          onClick={() => setActiveMapDay(plan.day)}
          style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 12,
            border: `1px solid ${DAY_COLORS[i % DAY_COLORS.length]}40`,
            background: activeMapDay === plan.day ? DAY_COLORS[i % DAY_COLORS.length] : 'transparent',
            color: activeMapDay === plan.day ? 'var(--white)' : DAY_COLORS[i % DAY_COLORS.length],
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Day {plan.day}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button
        onClick={() => setShowMap(false)}
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: '1px solid var(--sand-3)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-3)', fontSize: 16,
        }}
      >
        ×
      </button>
    </div>

    {/* Map itself */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <MapPanel itinerary={itinerary} activeDay={activeMapDay} />
    </div>
  </div>
)}
        </main>
      </div>

      {/* Global hover reveal for book button — JS fallback for hover opacity */}
      <style>{`
        .wp-activity:hover .book-btn { opacity: 1 !important; }
      `}</style>
    </>
  );
}
