'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TrackerEntry } from '@/types';
import { MapPin, ExternalLink, Share2, User, ShieldCheck, Check } from 'lucide-react';

interface InteractiveMapProps {
  events: TrackerEntry[];
  selectedEvent: TrackerEntry | null;
  onSelectEvent: (event: TrackerEntry | null) => void;
  tileUrl?: string;
}

// Center of Tamil Nadu (Trichy region)
const TAMIL_NADU_CENTER: [number, number] = [10.8505, 78.6856];
const DEFAULT_ZOOM = 7.3;

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

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function createLocationPin(isSelected: boolean) {
  const pulseRing = isSelected
    ? `<span class="absolute -inset-2 rounded-full border-2 border-[#F5C542] animate-ping opacity-75 pointer-events-none"></span>`
    : `<span class="absolute -inset-1 rounded-full border border-[#F5C542]/40 animate-pulse pointer-events-none"></span>`;

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
      isSelected ? 'scale-125 z-50' : 'hover:scale-115'
    }">
      ${pulseRing}
      <div class="relative w-8 h-8 rounded-full border-2 border-[#19182B] flex items-center justify-center text-[#19182B] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)]" style="background: radial-gradient(circle, #F5C542 60%, #D4A325 100%);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#19182B" stroke="#19182B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
          <circle cx="12" cy="10" r="3" fill="#F5C542"/>
        </svg>
      </div>
      <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#D4A325] -mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-location-pin',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
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
          title: `${entry.title} - Veeramani Tracker`,
          text: `Public appearance announcement in ${entry.district}: ${entry.title}`,
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
      {/* Top Announcement Counter HUD */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#19182B]/90 backdrop-blur-md border border-[#32304F] text-xs shadow-lg">
        <MapPin className="w-3.5 h-3.5 text-[#F5C542]" />
        <span className="text-[#FFF8E8] font-semibold">{events.length} Public Announcements</span>
        <span className="text-[10px] uppercase font-bold text-[#438567] bg-[#438567]/20 px-1.5 py-0.5 rounded border border-[#438567]/40">
          VERIFIED
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
          const icon = createLocationPin(isSelected);
          const venueDisplay = entry.venue_name || entry.landmark_name || entry.district;
          const pubDate = formatDate(entry.approved_at || entry.created_at);
          const sourceLink = entry.source_url || (entry.note?.match(/https?:\/\/[^\s]+/)?.[0]);

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
                <div className="p-3.5 max-w-[290px] text-[#FFF8E8] bg-[#1E1D33] rounded-xl border border-[#32304F] shadow-2xl">
                  {/* Optional Image */}
                  {(entry.image_url || entry.media_path) && (
                    <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-[#151424]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.image_url || entry.media_path || ''}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Header Badge & Date */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-[#438567]/20 text-[#79d4a8] border border-[#438567]/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#79d4a8]" />
                      Public Announcement
                    </span>
                    {pubDate && (
                      <span className="text-[10px] text-[#A5A2AD] font-mono">
                        {pubDate}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#FFF8E8] line-clamp-2 leading-snug mb-1">
                    {entry.title}
                  </h3>

                  {/* Venue & City */}
                  <p className="text-xs text-[#F5C542] mb-2 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-[#F16F59] shrink-0" />
                    <span>{venueDisplay}, {entry.district}</span>
                  </p>

                  {/* Note / Description */}
                  <p className="text-xs text-[#C5C2CE] line-clamp-3 leading-relaxed bg-[#151424] p-2 rounded-lg border border-[#32304F] mb-2">
                    {entry.note || entry.description}
                  </p>

                  {/* Submitter Name if opted in */}
                  {entry.author_display_name && (
                    <div className="text-[10px] text-[#A5A2AD] flex items-center gap-1 mb-2">
                      <User className="w-3 h-3" />
                      <span>Reported by {entry.author_display_name}</span>
                    </div>
                  )}

                  {/* Actions & Public Source Link */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#32304F]/60">
                    {sourceLink ? (
                      <a
                        href={sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="flex-1 text-[10px] text-[#A5A2AD] text-center">
                        Verified Public Event
                      </div>
                    )}

                    <button
                      onClick={(e) => handleShare(e, entry)}
                      title="Share Announcement"
                      className="p-1.5 bg-[#32304F] hover:bg-[#F5C542] hover:text-[#19182B] text-[#FFF8E8] rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-[#79d4a8]" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
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
