'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { FilterBar } from '@/components/filter-bar';
import { MapWrapper } from '@/components/map/map-wrapper';
import { EventCard } from '@/components/event-card';
import { IntroAnimation } from '@/components/intro-animation';
import { TrackerEntry, TrackerFilters } from '@/types';
import { ReportPanel } from '@/components/report-panel';
import {
  Compass,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  Radio,
  Sparkles,
  X
} from 'lucide-react';

export default function HomePage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [filters, setFilters] = useState<TrackerFilters & { city?: string }>({
    search: '',
    district: 'All Districts',
    category: 'all',
    signalStrength: 'all',
  });

  const fetchEntries = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.district && filters.district !== 'All Districts') {
        params.set('district', filters.district);
      }
      if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category);
      }
      if (filters.signalStrength && filters.signalStrength !== 'all') {
        params.set('signalStrength', filters.signalStrength);
      }

      // Try primary tracker-entries endpoint, fallback to events alias
      const res = await fetch(`/api/tracker-entries?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Connection konjam scene podudhu. Retry pannunga.');
      }
      const data = await res.json();
      const loaded: TrackerEntry[] = data.entries || data.events || [];
      setEntries(loaded);
      if (selectedEntry && !loaded.some((e) => e.id === selectedEntry.id)) {
        setSelectedEntry(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan parody radar signals');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.district, filters.category, filters.signalStrength, selectedEntry]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchEntries();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [fetchEntries]);

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      {/* Branded 2.4s Session Intro Animation */}
      <IntroAnimation />

      {/* Top Navbar with quick report modal launcher */}
      <Navbar onOpenReport={() => setIsReportOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4">
        {/* Welcome Tagline & Fictional Disclaimer HUD Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#32304F] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#7D263D] text-[#FFF8E8] border border-[#9B334E] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F5C542]" />
                100% FICTIONAL PARODY RADAR
              </span>
              <span className="text-xs text-[#F5C542] font-tamil hidden xs:inline">
                நையாண்டி ரேடார்
              </span>
              <span className="text-xs text-[#A5A2AD] font-mono hidden md:inline">
                • Map-la enna scene?
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-[#FFF8E8] mt-1 flex items-center gap-2">
              <span>Veeramani Tracker Parody Desk</span>
              <span className="text-xs font-mono font-normal text-[#F5C542] bg-[#222038] px-2 py-0.5 rounded border border-[#32304F]">
                104.2 MHz
              </span>
            </h1>
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#F5C542]/40 text-[#F5C542] text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Transmit a Parody Signal</span>
          </button>
        </div>

        {/* Clear Fictional Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-[#222038]/80 border border-[#32304F] flex items-center justify-between gap-3 text-xs text-[#A5A2AD]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#F5C542] animate-pulse shrink-0" />
            <span>
              <strong className="text-[#FFF8E8]">Fictional Demo Notice:</strong> Pins represent simulated Tamil internet lore and parody pings.
              Zero actual personal tracking or real coordinates.
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#151424] text-[#79d4a8] border border-[#438567]/30 shrink-0">
            DEMO MODE ACTIVE
          </span>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={entries.length}
        />

        {/* Content Area: Map or List View */}
        {error ? (
          <div className="w-full p-8 rounded-2xl bg-[#1E1D33] border border-[#7D263D] flex flex-col items-center justify-center text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#F16F59]" />
            <h3 className="font-bold text-base text-[#FFF8E8] font-display">
              Connection konjam scene podudhu.
            </h3>
            <p className="text-xs text-[#A5A2AD] max-w-md">
              Unable to reach the parody signal datastore right now. Check your connection or click retry below.
            </p>
            <button
              onClick={fetchEntries}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Pannunga</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Accessible Signal Dossier List View */
          <div className="w-full space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-[#1E1D33] border border-[#32304F] animate-pulse p-5 space-y-4"
                  >
                    <div className="w-24 h-5 bg-[#32304F] rounded-md" />
                    <div className="w-full h-6 bg-[#32304F] rounded-md" />
                    <div className="w-3/4 h-4 bg-[#32304F] rounded-md" />
                    <div className="w-full h-16 bg-[#32304F]/60 rounded-md mt-4" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="w-full p-12 rounded-2xl bg-[#1E1D33] border border-[#32304F] text-center flex flex-col items-center justify-center space-y-3">
                <Compass className="w-12 h-12 text-[#F5C542]/40" />
                <h3 className="text-base font-bold text-[#FFF8E8] font-display">
                  Inga ippo signal illa. Map konjam relax pannattum.
                </h3>
                <p className="text-xs text-[#A5A2AD] max-w-sm">
                  No parody signals found matching this filter frequency. Try selecting All Districts or All Categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <EventCard
                    key={entry.id}
                    event={entry}
                    isSelected={selectedEntry?.id === entry.id}
                    onSelect={setSelectedEntry}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Interactive Radar Map View with Side Drawer / Mobile Sheet */
          <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-[#32304F] shadow-2xl flex">
            {/* Map Canvas */}
            <div className="flex-1 w-full h-full">
              <MapWrapper
                events={entries}
                selectedEvent={selectedEntry}
                onSelectEvent={setSelectedEntry}
              />
            </div>

            {/* Desktop Side Signal Dossier Drawer */}
            {selectedEntry && (
              <div className="hidden lg:flex w-96 bg-[#1E1D33] border-l border-[#32304F] flex-col overflow-y-auto p-5 z-10 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#32304F]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5C542] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#F5C542]" />
                    <span>Signal Dossier</span>
                  </span>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 rounded-lg text-[#A5A2AD] hover:text-[#FFF8E8] hover:bg-[#32304F] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <EventCard event={selectedEntry} isSelected={true} />
                </div>
              </div>
            )}

            {/* Mobile Bottom Sheet Drawer */}
            {selectedEntry && (
              <div className="lg:hidden absolute bottom-3 left-3 right-3 z-30 bg-[#1E1D33] border border-[#F5C542]/60 rounded-2xl shadow-2xl p-4 max-h-[80%] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-[#F5C542] flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#F5C542]" />
                    <span>Signal Dossier</span>
                  </span>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 text-[#A5A2AD] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EventCard event={selectedEntry} compact={true} isSelected={true} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151424]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-150">
            <ReportPanel
              isFloating={true}
              onClose={() => setIsReportOpen(false)}
              onSuccess={() => {
                fetchEntries();
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
