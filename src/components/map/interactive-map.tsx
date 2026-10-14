'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TrackerEntry } from '@/types';
import { MapPin } from 'lucide-react';

interface InteractiveMapProps {
  events: TrackerEntry[];
  selectedEvent: TrackerEntry | null;
  onSelectEvent: (event: TrackerEntry | null) => void;
  tileUrl?: string;
}

// Center of Tamil Nadu (Trichy region)
const TAMIL_NADU_CENTER: [number, number] = [10.8505, 78.6856];
const DEFAULT_ZOOM = 7.3;

/**
 * MapViewUpdater handles:
 * 1. One-shot auto-focus when a report is intentionally selected.
 * 2. Instant cancellation of programmatic flyTo if the user manually pans or zooms.
 * 3. Clearing selection when an empty area of the map is clicked without interfering with marker clicks.
 * 4. Preventing duplicate flyTo triggers on re-renders.
 */
export function MapViewUpdater({
  selectedEvent,
  onSelectEvent,
}: {
  selectedEvent: TrackerEntry | null;
  onSelectEvent: (event: TrackerEntry | null) => void;
}) {
  const map = useMap();
  const lastFocusedIdRef = useRef<string | null>(null);
  const isProgrammaticMoveRef = useRef(false);

  // 1. One-shot focus when a report marker is selected
  useEffect(() => {
    if (!selectedEvent) {
      lastFocusedIdRef.current = null;
      // Stop any pending flyTo animation immediately without altering center or zoom
      map.stop();
      map.closePopup();
      return;
    }

    // Only focus if selecting a DIFFERENT report
    if (selectedEvent.id !== lastFocusedIdRef.current) {
      lastFocusedIdRef.current = selectedEvent.id;
      isProgrammaticMoveRef.current = true;
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : DEFAULT_ZOOM;
      // Preserve user's detailed zoom if already zoomed in (>= 13); otherwise focus to level 13
      const targetZoom = currentZoom >= 13 ? currentZoom : 13;
      map.flyTo([selectedEvent.latitude, selectedEvent.longitude], targetZoom, {
        duration: 1.0,
      });
    }
  }, [selectedEvent, map]);

  // 2. Map event handlers for user-initiated gestures & empty-space clicks
  useEffect(() => {
    const handleMoveEnd = () => {
      isProgrammaticMoveRef.current = false;
    };

    // If user starts manual interaction (drag, zoom, wheel, touch), cancel programmatic animation immediately
    const handleUserInteraction = () => {
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        map.stop();
      }
    };

    // Clicking an empty map area closes the selected report
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const originalTarget = e.originalEvent?.target as HTMLElement | null;

      // Do not dismiss if the click was on a marker pin or interactive element
      if (
        originalTarget?.closest?.('.custom-location-pin') ||
        originalTarget?.closest?.('.custom-map-pin') ||
        originalTarget?.closest?.('.leaflet-marker-icon') ||
        originalTarget?.closest?.('[role="button"]')
      ) {
        return;
      }

      map.stop();
      onSelectEvent(null);
    };

    map.on('moveend', handleMoveEnd);
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('mousedown', handleUserInteraction);
    map.on('touchstart', handleUserInteraction);
    map.on('click', handleMapClick);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
      map.off('mousedown', handleUserInteraction);
      map.off('touchstart', handleUserInteraction);
      map.off('click', handleMapClick);
    };
  }, [map, onSelectEvent]);

  return null;
}

// Backward-compatible alias
export const MapController = MapViewUpdater;

/**
 * Creates custom Parody Radar Pin with clear interactive hitbox,
 * non-blocking animated rings, and distinct selected styling.
 */
export function createParodyRadarPin(isSelected: boolean) {
  const pulseRing = isSelected
    ? `<span class="absolute -inset-2 rounded-full border-2 border-[#F5C542] animate-ping opacity-75 pointer-events-none"></span>`
    : `<span class="absolute -inset-1 rounded-full border border-[#F5C542]/40 animate-pulse pointer-events-none"></span>`;

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 pointer-events-auto ${
      isSelected ? 'scale-125 z-50' : 'hover:scale-115 z-10'
    }" role="button" aria-label="Radar location pin" tabindex="0">
      ${pulseRing}
      <div class="relative w-8 h-8 rounded-full border-2 ${
        isSelected ? 'border-[#FFF8E8] ring-2 ring-[#F5C542]' : 'border-[#19182B]'
      } flex items-center justify-center text-[#19182B] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)]" style="background: radial-gradient(circle, #F5C542 60%, #D4A325 100%);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#19182B" stroke="#19182B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
          <circle cx="12" cy="10" r="3" fill="#F5C542"/>
        </svg>
      </div>
      <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#D4A325] -mt-0.5 pointer-events-none"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: `custom-location-pin custom-map-pin ${isSelected ? 'pin-selected' : ''}`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
  });
}

// Backward-compatible alias
export const createLocationPin = createParodyRadarPin;

export default function InteractiveMap({
  events,
  selectedEvent,
  onSelectEvent,
  tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}: InteractiveMapProps) {
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

        {/* Unified MapViewUpdater: Handles one-shot auto-zoom & user gesture priority */}
        <MapViewUpdater
          selectedEvent={selectedEvent}
          onSelectEvent={onSelectEvent}
        />

        {events.map((entry) => {
          const isSelected = selectedEvent?.id === entry.id;
          const icon = createParodyRadarPin(isSelected);

          return (
            <Marker
              key={entry.id}
              position={[entry.latitude, entry.longitude]}
              icon={icon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: (e) => {
                  // Stop propagation on both Leaflet and native DOM event
                  if (e.originalEvent) {
                    e.originalEvent.stopPropagation();
                    L.DomEvent.stopPropagation(e.originalEvent);
                  }
                  onSelectEvent(entry);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
