'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { EventItem } from '@/types';
import { Compass } from 'lucide-react';

interface MapWrapperProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem | null) => void;
  tileUrl?: string;
}

const DynamicInteractiveMap = dynamic(
  () => import('./interactive-map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-[#151424] text-[#FFF8E8] rounded-xl border border-[#32304F] p-8">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#F5C542]/40 flex items-center justify-center animate-spin">
            <Compass className="w-8 h-8 text-[#F5C542]" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#F16F59] border-t-transparent animate-spin" />
        </div>
        <p className="text-base font-bold text-[#F5C542] font-display">Map set aagudhu...</p>
        <p className="text-xs text-[#A5A2AD] mt-1 font-tamil">தமிழ்நாடு வரைபடம் தயாராகிறது</p>
      </div>
    ),
  }
);

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicInteractiveMap {...props} />;
}
