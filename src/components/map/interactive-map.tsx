'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TrackerEntry, SIGNAL_CATEGORIES } from '@/types';
import { Radio, Share2, ExternalLink, Sparkles, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';

interface InteractiveMapProps {
  events: TrackerEntry[];
  selectedEvent: TrackerEntry | null;
  onSelectEvent: (event: TrackerEntry | null) => void;
  tileUrl?: string;
}

// Center of Tamil Nadu (approx Trichy region)
const TAMIL_NADU_CENTER: [number, number] = [10.8505, 78.6856];
const DEFAULT_ZOOM = 7.3;

// Component to fly to selected marker
function MapViewUpdater({ selectedEvent }: { selectedEvent: TrackerEntry | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedEvent) {
      map.flyTo([selectedEvent.latitude, selectedEvent.longitude], 13, {
        duration: 1.2,
      });
    }
  }, [selectedEvent, map]);

  return null;
}

function createParodyRadarPin(entry: TrackerEntry, isSelected: boolean) {
  const cat = SIGNAL_CATEGORIES[entry.category] || { color: '#F5C542' };
  const pinColor = isSelected ? '#F5C542' : cat.color;
  const pulseRing = `
    <span class="absolute -inset-2 rounded-full border-2 border-[${pinColor}] animate-ping opacity-60 pointer-events-none"></span>
    <span class="absolute -inset-4 rounded-full border border-[${pinColor}]/30 animate-pulse pointer-events-none"></span>
  `;

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
      isSelected ? 'scale-125 z-50' : 'hover:scale-115'
    }">
      ${pulseRing}
      <div class="relative w-9 h-9 rounded-2xl border-2 border-[#19182B] flex items-center justify-center text-[#19182B] font-black shadow-[0_4px_16px_rgba(0,0,0,0.5)]" style="background: radial-gradient(circle, ${pinColor} 40%, #19182B 150%);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19182B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="2" fill="#19182B"/>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
        </svg>
        <span class="absolute -top-1 -right-1 px-1 py-0.2 bg-[#19182B] border border-[${pinColor}] text-[8px] font-mono font-bold text-[${pinColor}] rounded">
          ${entry.frequency_mhz || 104.2}
        </span>
      </div>
      <div style="border-top-color: ${pinColor};" class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] -mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-radar-pin',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });
}

export default function InteractiveMap({
  events,
  selectedEvent,
  onSelectEvent,
  tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}: InteractiveMapProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, entry: TrackerEntry) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/event/${entry.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entry.title} - Veeramani Tracker Parody`,
          text: `Check out this fictional parody radar ping in ${entry.district}: ${entry.title}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-[#32304F] bg-[#151424]">
      {/* Top Overlay HUD Bar */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#19182B]/90 backdrop-blur-md border border-[#32304F] text-xs shadow-lg">
        <Radio className="w-3.5 h-3.5 text-[#F5C542] animate-pulse" />
        <span className="font-mono text-[#F5C542] font-bold">104.2 MHz</span>
        <span className="text-[#A5A2AD]">•</span>
        <span className="text-[#FFF8E8] font-medium">{events.length} Parody Signals Active</span>
        <span className="text-[10px] uppercase font-bold text-[#438567] bg-[#438567]/20 px-1.5 py-0.5 rounded border border-[#438567]/40">
          SIMULATED PINGS
        </span>
      </div>

      <MapContainer
        center={TAMIL_NADU_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url={tileUrl}
        />

        <MapViewUpdater selectedEvent={selectedEvent} />

        {events.map((entry) => {
          const isSelected = selectedEvent?.id === entry.id;
          const icon = createParodyRadarPin(entry, isSelected);
          const catMeta = SIGNAL_CATEGORIES[entry.category] || {
            label: entry.category,
            color: '#F5C542',
            tamil: 'நையாண்டி',
          };

          return (
            <Marker
              key={entry.id}
              position={[entry.latitude, entry.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectEvent(entry),
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-3.5 max-w-[300px] text-[#FFF8E8] bg-[#1E1D33] rounded-xl border border-[#32304F] shadow-2xl">
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      style={{
                        color: catMeta.color,
                        borderColor: `${catMeta.color}40`,
                        backgroundColor: `${catMeta.color}15`,
                      }}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border"
                    >
                      {catMeta.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#F16F59] font-mono">
                      <Sparkles className="w-3 h-3 text-[#F16F59]" />
                      SIMULATED PING
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#FFF8E8] line-clamp-2 leading-snug mb-1">
                    {entry.title}
                  </h3>

                  {/* Landmark & District */}
                  <p className="text-xs text-[#A5A2AD] mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#F5C542] shrink-0" />
                    <span>{entry.landmark_name}, {entry.district}</span>
                  </p>

                  {/* Approved Parody Note */}
                  <div className="bg-[#151424] p-2 rounded-lg border border-[#32304F] mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#F5C542] block mb-0.5">
                      Approved Parody Note:
                    </span>
                    <p className="text-xs text-[#FFF8E8] italic leading-snug">
                      &ldquo;{entry.note || entry.description}&rdquo;
                    </p>
                  </div>

                  {/* Signal Strength & Frequency Readout */}
                  <div className="flex items-center justify-between text-[11px] text-[#A5A2AD] font-mono border-t border-[#32304F] pt-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[#F5C542]" />
                      <span>{entry.frequency_mhz || 104.2} MHz</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#79d4a8]">
                      <span>Intensity: {entry.signal_strength || 85}%</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Link
                      href={`/event/${entry.id}`}
                      className="flex-1 py-1.5 px-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Signal Dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={(e) => handleShare(e, entry)}
                      title="Share Parody Signal"
                      className="p-1.5 bg-[#32304F] hover:bg-[#F16F59] text-[#FFF8E8] rounded-lg transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {copiedId === entry.id && (
                    <p className="text-[10px] text-center text-[#79d4a8] mt-1 font-mono">
                      Parody signal link copied!
                    </p>
                  )}

                  {/* Anti-stalking parody disclaimer */}
                  <div className="mt-2 pt-1 border-t border-[#32304F]/60 flex items-center gap-1 text-[9px] text-[#A5A2AD]">
                    <AlertTriangle className="w-3 h-3 text-[#F16F59] shrink-0" />
                    <span>Fictional demonstration. Zero personal tracking.</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
