'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { MapWrapper } from '@/components/map/map-wrapper';
import { EventCard } from '@/components/event-card';
import { IntroAnimation } from '@/components/intro-animation';
import { TrackerEntry } from '@/types';
import { ReportPanel } from '@/components/report-panel';
import {
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  X
} from 'lucide-react';

export default function HomePage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null);
  const [search, setSearch] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tracker-entries');
      if (!res.ok) {
        throw new Error('Unable to connect to tracker datastore. Please retry.');
      }
      const data = await res.json();
      const loaded: TrackerEntry[] = data.entries || data.events || [];
      setEntries(loaded);

      // Keep selected entry in sync
      if (selectedEntry) {
        const updated = loaded.find((e) => e.id === selectedEntry.id);
        if (updated) setSelectedEntry(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tracker map pins');
    } finally {
      setLoading(false);
    }
  }, [selectedEntry]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Client-side search filtering across title, venue, city, note
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const query = search.toLowerCase().trim();
    return entries.filter((e) => {
      const titleMatch = e.title?.toLowerCase().includes(query);
      const districtMatch = (e.district || e.city || '')?.toLowerCase().includes(query);
      const venueMatch = (e.venue_name || e.landmark_name || '')?.toLowerCase().includes(query);
      const noteMatch = (e.note || e.description || '')?.toLowerCase().includes(query);
      return titleMatch || districtMatch || venueMatch || noteMatch;
    });
  }, [entries, search]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#19182B] text-[#FFF8E8] overflow-hidden select-none">
      {/* 2.4s Branded Intro Animation */}
      <IntroAnimation />

      {/* Header: Wordmark, Compact Search, Report Button, Account Menu */}
      <Navbar
        onOpenReport={() => setIsReportOpen(true)}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      {/* Main Full-Screen Map Area */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#19182B]/95 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#F16F59]" />
            <h3 className="font-bold text-base text-[#FFF8E8] font-display">
              Unable to load map data
            </h3>
            <p className="text-xs text-[#A5A2AD] max-w-sm">
              {error}
            </p>
            <button
              onClick={fetchEntries}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Interactive Leaflet Map Canvas */}
            <MapWrapper
              events={filteredEntries}
              selectedEvent={selectedEntry}
              onSelectEvent={setSelectedEntry}
            />

            {/* Desktop Selected Pin Detail Card (Floating Side Panel) */}
            {selectedEntry && (
              <div className="hidden md:block absolute top-4 right-4 z-20 w-96 max-h-[calc(100%-2rem)] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="relative">
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-[#151424]/80 text-[#A5A2AD] hover:text-[#FFF8E8] hover:bg-[#32304F] transition-colors cursor-pointer"
                    aria-label="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <EventCard
                    event={selectedEntry}
                    isSelected={true}
                    onClose={() => setSelectedEntry(null)}
                  />
                </div>
              </div>
            )}

            {/* Mobile Bottom Sheet Drawer for Selected Pin */}
            {selectedEntry && (
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1D33] border-t-2 border-[#F5C542]/60 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] p-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                {/* Drag / Close Handle */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#32304F]">
                  <div className="w-12 h-1 bg-[#32304F] rounded-full mx-auto" />
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 rounded-lg text-[#A5A2AD] hover:text-[#FFF8E8] hover:bg-[#32304F] transition-colors cursor-pointer ml-auto"
                    aria-label="Close bottom sheet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EventCard
                  event={selectedEntry}
                  compact={true}
                  isSelected={true}
                  onClose={() => setSelectedEntry(null)}
                />
              </div>
            )}

            {/* Mobile Floating Report Button (Bottom-Right FAB) */}
            <div className="md:hidden fixed bottom-6 right-5 z-30">
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-xs uppercase tracking-wider rounded-full shadow-[0_4px_20px_rgba(245,197,66,0.5)] transition-all cursor-pointer"
                aria-label="Report a public appearance"
              >
                <PlusCircle className="w-4 h-4 text-[#19182B]" />
                <span>Report</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Single-Field Public Appearance Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151424]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-150">
            <ReportPanel
              isFloating={true}
              onClose={() => setIsReportOpen(false)}
              onSuccess={(entry) => {
                fetchEntries();
                if (entry) setSelectedEntry(entry);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
