'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────
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
  id: string;
  destination: string;
  days: number;
  style: string;
  overview: string;
  plans: DayPlan[];
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────
const TYPE_CONFIG = {
  attraction: { label: 'Attraction', color: '#0f6e56', bg: '#e1f5ee' },
  food:       { label: 'Food & Drink', color: '#7c4f0a', bg: '#fef3c7' },
  hotel:      { label: 'Stay',         color: '#1e429f', bg: '#ebf5fb' },
  experience: { label: 'Experience',   color: '#6b21a8', bg: '#f3e8ff' },
};

// ─── Page ─────────────────────────────────────────────────
export default function ItineraryPage() {
  const params = useParams();
const id = typeof params?.id === 'string' ? params.id : '';

if (!id) return null;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/itinerary/${id}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setItinerary(data);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const toggleDay = (d: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sand: #faf9f6; --sand-2: #f3f1ec; --sand-3: #e8e4dc; --sand-4: #d4cfc4;
          --ink: #1a1714; --ink-2: #4a4540; --ink-3: #8a8480;
          --amber: #d97706; --amber-light: #fef3c7; --amber-dark: #92400e;
          --white: #ffffff;
          --font-serif: 'Lora', Georgia, serif;
          --font-sans: 'DM Sans', system-ui, sans-serif;
          --transition: 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }

        html, body { min-height: 100%; background: var(--sand); font-family: var(--font-sans); color: var(--ink); }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--sand-4); border-radius: 4px; }

        .wp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; white-space: nowrap;
        }
        .wp-day-card {
          border: 1px solid var(--sand-3); border-radius: 16px;
          background: var(--white); overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          animation: fadeUp 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .wp-day-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; cursor: pointer; background: var(--sand);
          border-bottom: 1px solid transparent; transition: background var(--transition); user-select: none;
        }
        .wp-day-header:hover { background: var(--sand-2); }
        .wp-day-header.open { border-bottom-color: var(--sand-3); }
        .wp-activity {
          display: flex; gap: 14px; padding: 14px 18px;
          border-bottom: 1px solid var(--sand-2); transition: background var(--transition);
        }
        .wp-activity:last-child { border-bottom: none; }
        .wp-activity:hover { background: #fdfcfb; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--white)',
        borderBottom: '1px solid var(--sand-3)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0.5L7.5 4.5H11.5L8.25 7L9.5 11L6 8.75L2.5 11L3.75 7L0.5 4.5H4.5L6 0.5Z" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
            Itinera
          </span>
        </a>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href="/"
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--sand-3)',
              background: 'var(--white)',
              fontSize: 12,
              color: 'var(--ink-2)',
              cursor: 'pointer',
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          >
            New itinerary
          </a>
          <button
            onClick={copyLink}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: copied ? '#0f6e56' : 'var(--ink)',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.2s ease',
            }}
          >
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Loading */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 10,
          }}>
            <svg className="spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="var(--sand-3)" strokeWidth="2"/>
              <path d="M9 2C12.866 2 16 5.134 16 9" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Loading itinerary...</span>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12, color: 'var(--ink)' }}>
              Itinerary not found
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24 }}>
              This link may have expired. Itineraries are stored in memory and reset when the server restarts.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                borderRadius: 10,
                background: 'var(--ink)',
                color: 'white',
                textDecoration: 'none',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Generate a new itinerary
            </a>
          </div>
        )}

        {/* Itinerary */}
        {itinerary && !loading && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 1.25,
                color: 'var(--ink)',
                marginBottom: 10,
              }}>
                {itinerary.days} {itinerary.days === 1 ? 'day' : 'days'} in{' '}
                <em style={{ color: 'var(--amber)' }}>{itinerary.destination}</em>
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'var(--amber-light)',
                  color: 'var(--amber-dark)',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {itinerary.style.charAt(0).toUpperCase() + itinerary.style.slice(1)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {new Date(itinerary.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.75, marginBottom: 20 }}>
                {itinerary.overview}
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 20, paddingTop: 16, borderTop: '1px solid var(--sand-3)' }}>
                {[
                  { label: 'Days',           value: itinerary.days },
                  { label: 'Activities',     value: itinerary.plans.reduce((s, p) => s + p.activities.length, 0) },
                  { label: 'Neighbourhoods', value: itinerary.plans.length },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {itinerary.plans.map((plan, pi) => {
                const open = expandedDays.has(plan.day);
                return (
                  <div key={plan.day} className="wp-day-card" style={{ animationDelay: `${pi * 60}ms` }}>
                    <div
                      className={`wp-day-header${open ? ' open' : ''}`}
                      onClick={() => toggleDay(plan.day)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: 'var(--ink)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
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
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          style={{
                            color: 'var(--ink-3)',
                            transform: open ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {open && (
                      <div>
                        {plan.activities.map((act, ai) => {
                          const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.attraction;
                          return (
                            <div key={ai} className="wp-activity">
                              <div style={{ flexShrink: 0, width: 38, paddingTop: 2 }}>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{act.time}</div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <span className="wp-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                                    {cfg.label}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{act.duration}</span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{act.name}</div>
                                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 4 }}>{act.description}</div>
                                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{act.cost}</div>
                                {act.detailsUrl && (
                                  <a
                                    href={act.detailsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--amber)',
                                      textDecoration: 'none',
                                      marginTop: 4,
                                      display: 'inline-block',
                                    }}
                                  >
                                    Learn more
                                  </a>
                                )}
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

            {/* Footer */}
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <button
                onClick={copyLink}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: copied ? '#0f6e56' : 'var(--ink)',
                  color: 'white',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.2s ease',
                  marginBottom: 16,
                }}
              >
                {copied ? 'Link copied!' : 'Copy shareable link'}
              </button>
              <div>
                <a
                  href="/"
                  style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
                >
                  Generate a new itinerary
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
