'use client';

import React, { useState } from 'react';
import { TrackerEntry } from '@/types';
import {
  MapPin,
  ExternalLink,
  Share2,
  Calendar,
  User,
  ShieldCheck,
  Check
} from 'lucide-react';

interface EventCardProps {
  event: TrackerEntry;
  isSelected?: boolean;
  onSelect?: (event: TrackerEntry) => void;
  compact?: boolean;
  onClose?: () => void;
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

export function EventCard({
  event,
  isSelected = false,
  onSelect,
  compact = false,
  onClose: _onClose,
}: EventCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/event/${event.id}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - Veeramani Tracker`,
          text: `Public appearance announcement in ${event.district}: ${event.title}`,
          url,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const venueDisplay = event.venue_name || event.landmark_name || event.district;
  const pubDate = formatDate(event.approved_at || event.created_at);
  const sourceLink = event.source_url || (event.note?.match(/https?:\/\/[^\s]+/)?.[0]);

  return (
    <div
      onClick={() => onSelect?.(event)}
      className={`relative rounded-2xl bg-[#1E1D33] border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-[#F5C542] ring-2 ring-[#F5C542]/20 shadow-[0_8px_30px_rgba(245,197,66,0.15)]'
          : 'border-[#32304F] hover:border-[#F5C542]/60 hover:shadow-lg'
      } ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      <div>
        {/* Optional Approved Announcement Image */}
        {(event.image_url || event.media_path) && (
          <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#151424]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url || event.media_path || ''}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#438567]/20 text-[#79d4a8] border border-[#438567]/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#79d4a8]" />
            Verified Public Appearance
          </span>

          {pubDate && (
            <span className="text-[10px] text-[#A5A2AD] font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#A5A2AD]" />
              {pubDate}
            </span>
          )}
        </div>

        {/* Title / Headline */}
        <h3 className="font-display font-black text-base sm:text-lg text-[#FFF8E8] leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* City & Venue */}
        <p className="text-xs sm:text-sm text-[#F5C542] flex items-center gap-1.5 mb-2.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#F16F59] shrink-0" />
          <span>{venueDisplay}</span>
          <span className="text-[#A5A2AD]">• {event.district}</span>
        </p>

        {/* Short Note or Description */}
        <p className="text-xs text-[#C5C2CE] leading-relaxed bg-[#151424] p-3 rounded-xl border border-[#32304F] mb-3">
          {event.note || event.description}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="space-y-2 pt-2 border-t border-[#32304F]">
        <div className="flex items-center justify-between text-xs text-[#A5A2AD]">
          {/* Submitter Name (if opted in) */}
          {event.author_display_name ? (
            <span className="flex items-center gap-1 text-[11px] text-[#A5A2AD]">
              <User className="w-3 h-3 text-[#A5A2AD]" />
              <span>Reported by {event.author_display_name}</span>
            </span>
          ) : (
            <span className="text-[10px] text-[#A5A2AD]">Public Announcement</span>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-[11px] text-[#A5A2AD] hover:text-[#FFF8E8] transition-colors p-1"
            title="Share Announcement"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#79d4a8]" />
                <span className="text-[#79d4a8]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Public Source Link */}
        {sourceLink && (
          <a
            href={sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#32304F] hover:border-[#F5C542]/40 text-xs font-semibold text-[#F5C542] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Public Announcement Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
