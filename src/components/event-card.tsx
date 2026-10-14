'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TrackerEntry, SIGNAL_CATEGORIES } from '@/types';
import {
  Radio,
  ExternalLink,
  Share2,
  Sparkles,
  MapPin,
  User,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface EventCardProps {
  event: TrackerEntry;
  isSelected?: boolean;
  onSelect?: (event: TrackerEntry) => void;
  compact?: boolean;
}

export function EventCard({
  event,
  isSelected = false,
  onSelect,
  compact = false,
}: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const cat = SIGNAL_CATEGORIES[event.category] || {
    label: event.category,
    color: '#F5C542',
    tamil: 'நையாண்டி',
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/event/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - Veeramani Tracker Parody`,
          text: `Check out this fictional parody radar ping in ${event.district}: ${event.title}`,
          url,
        });
        return;
      } catch {
        // clipboard fallback
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect?.(event)}
      className={`group relative rounded-2xl bg-[#1E1D33] border transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer ${
        isSelected
          ? 'border-[#F5C542] ring-2 ring-[#F5C542]/20 shadow-[0_8px_30px_rgba(245,197,66,0.15)]'
          : 'border-[#32304F] hover:border-[#F5C542]/60 hover:shadow-lg'
      } ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      {/* Top Banner / Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            style={{ color: cat.color, borderColor: `${cat.color}40`, backgroundColor: `${cat.color}15` }}
            className="px-2.5 py-0.5 text-[10px] sm:text-xs uppercase font-bold tracking-wider rounded-md border"
          >
            {cat.label}
          </span>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5C542]/15 text-[#F5C542] border border-[#F5C542]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F16F59]" />
              Simulated Ping
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base sm:text-lg text-[#FFF8E8] group-hover:text-[#F5C542] transition-colors line-clamp-2 leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* Landmark & District */}
        <p className="text-xs sm:text-sm text-[#C5C2CE] flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#F16F59] shrink-0" />
          <span className="font-medium">{event.landmark_name}</span>
          <span className="text-[#A5A2AD]">• {event.district}</span>
        </p>

        {/* Signal Strength & Frequency HUD Bar */}
        <div className="mb-3 p-2.5 rounded-xl bg-[#151424] border border-[#32304F] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A5A2AD] flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#F5C542]" />
              {event.frequency_mhz || 104.2} MHz
            </span>
            <span className="text-[#79d4a8] font-bold">
              {event.signal_strength || 85}% Strength
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#222038] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F5C542] to-[#438567] rounded-full"
              style={{ width: `${Math.min(100, Math.max(10, event.signal_strength || 85))}%` }}
            />
          </div>
        </div>

        {/* Parody Description / Lore */}
        {!compact && (
          <p className="text-xs text-[#A5A2AD] line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="border-t border-[#32304F] pt-3 mt-2 space-y-3">
        {/* Contributor Attribution & Status */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#A5A2AD] gap-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#F5C542]" />
            <span className="text-[11px] font-mono text-[#A5A2AD]">
              Recorded {new Date(event.created_at).toLocaleDateString()}
            </span>
          </div>

          {event.author_display_name && (
            <span className="flex items-center gap-1 text-[11px] text-[#A5A2AD]">
              <User className="w-3 h-3 text-[#F5C542]" />
              <span>By {event.author_display_name}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/event/${event.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-1.5 px-3 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Inspect Signal Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleShare}
            title="Share this parody signal"
            className="p-2 bg-[#222038] hover:bg-[#F16F59] text-[#FFF8E8] border border-[#32304F] hover:border-[#F16F59] rounded-xl transition-colors cursor-pointer relative"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#438567] text-white text-[10px] rounded shadow-md whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>

        {/* Parody notice */}
        <div className="flex items-center gap-1 text-[9px] text-[#A5A2AD] pt-1">
          <AlertTriangle className="w-3 h-3 text-[#F16F59] shrink-0" />
          <span>Fictional parody demonstration • Zero personal tracking</span>
        </div>
      </div>
    </div>
  );
}
