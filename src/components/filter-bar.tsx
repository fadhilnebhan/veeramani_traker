'use client';

import React from 'react';
import { SignalCategory, TrackerFilters, SIGNAL_CATEGORIES, TAMIL_NADU_DISTRICTS } from '@/types';
import { Search, Map, List, RotateCcw, Radio } from 'lucide-react';

interface FilterBarProps {
  filters: TrackerFilters & { city?: string };
  onFilterChange: (filters: TrackerFilters & { city?: string }) => void;
  viewMode: 'map' | 'list';
  onViewModeChange: (mode: 'map' | 'list') => void;
  totalResults: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalResults,
}: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, district: e.target.value, city: e.target.value });
  };

  const handleCategoryChange = (cat: SignalCategory | 'all') => {
    onFilterChange({ ...filters, category: cat });
  };

  const handleStrengthChange = (strength: TrackerFilters['signalStrength']) => {
    onFilterChange({ ...filters, signalStrength: strength });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      district: 'All Districts',
      city: 'All Districts',
      category: 'all',
      signalStrength: 'all',
    });
  };

  const isFiltered =
    Boolean(filters.search) ||
    (filters.district && filters.district !== 'All Districts' && filters.district !== 'All Cities') ||
    (filters.category && filters.category !== 'all') ||
    (filters.signalStrength && filters.signalStrength !== 'all');

  return (
    <div className="w-full bg-[#1E1D33] border border-[#32304F] rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
      {/* Top Row: Search Input, District Selector & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Radar Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A2AD]" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Scan for parody signal, district, tea stall lore, or landmark..."
            className="w-full pl-10 pr-4 py-2 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/70 focus:outline-none transition-colors"
          />
        </div>

        {/* District Selector */}
        <div className="flex items-center gap-2">
          <select
            value={filters.district || filters.city || 'All Districts'}
            onChange={handleDistrictChange}
            className="px-3 py-2 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] focus:outline-none cursor-pointer"
          >
            {TAMIL_NADU_DISTRICTS.map((dist) => (
              <option key={dist} value={dist} className="bg-[#19182B] text-[#FFF8E8]">
                {dist}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-[#151424] border border-[#32304F] rounded-xl p-0.5">
            <button
              onClick={() => onViewModeChange('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#F5C542] text-[#19182B] shadow-sm'
                  : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
              }`}
              title="Show Interactive Radar Map"
              aria-label="Map View"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Radar</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#F5C542] text-[#19182B] shadow-sm'
                  : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
              }`}
              title="Show Signal Dossier List"
              aria-label="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Signal Strength & Results Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#32304F]/60">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#A5A2AD] text-[11px] font-mono uppercase mr-1 hidden xs:inline">
            Signal Intensity:
          </span>
          <button
            onClick={() => handleStrengthChange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              (filters.signalStrength || 'all') === 'all'
                ? 'bg-[#222038] text-[#F5C542] border border-[#F5C542]/50 font-bold'
                : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
            }`}
          >
            All Frequencies
          </button>
          <button
            onClick={() => handleStrengthChange('high')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.signalStrength === 'high'
                ? 'bg-[#222038] text-[#438567] border border-[#438567]/50 font-bold'
                : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
            }`}
          >
            Strong Signals (&gt;85%)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A5A2AD]">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#F5C542] animate-pulse" />
            <strong className="text-[#FFF8E8]">{totalResults}</strong> parody signals active
          </span>
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[#F16F59] hover:underline cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`shrink-0 px-3 py-1 rounded-full border transition-all cursor-pointer ${
            (filters.category || 'all') === 'all'
              ? 'bg-[#F5C542] text-[#19182B] font-bold border-[#F5C542]'
              : 'bg-[#151424] text-[#A5A2AD] border-[#32304F] hover:border-[#A5A2AD]'
          }`}
        >
          All Categories
        </button>

        {(Object.keys(SIGNAL_CATEGORIES) as SignalCategory[]).map((cat) => {
          const isSelected = filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`shrink-0 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#222038] text-[#F5C542] border-[#F5C542] font-bold'
                  : 'bg-[#151424] text-[#C5C2CE] border-[#32304F] hover:border-[#A5A2AD]'
              }`}
            >
              {SIGNAL_CATEGORIES[cat].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
