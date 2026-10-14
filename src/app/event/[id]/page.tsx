'use client';

import React, { useEffect, useState, use } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { TrackerEntry } from '@/types';
import Link from 'next/link';
import {
  Share2,
  User,
  AlertCircle,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function SignalDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [entry, setEntry] = useState<TrackerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSignal() {
      setLoading(true);
      try {
        let res = await fetch(`/api/tracker-entries/${id}`);
        if (!res.ok) {
          res = await fetch(`/api/events/${id}`);
        }
        if (!res.ok) {
          throw new Error('This public appearance announcement was not found or has concluded.');
        }
        const data = await res.json();
        setEntry(data.entry || data.event);
      } catch (err: any) {
        setError(err.message || 'Failed to load announcement details.');
      } finally {
        setLoading(false);
      }
    }

    loadSignal();
  }, [id]);

  const handleShare = async () => {
    if (!entry) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entry.title} - Veeramani Tracker`,
          text: `Public appearance announcement in ${entry.district}: ${entry.title}`,
          url: shareUrl,
        });
        return;
      } catch {
        // clipboard fallback
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#F5C542] border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-semibold text-[#F5C542] font-mono">Loading announcement details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#F16F59] mx-auto" />
          <h1 className="text-xl font-bold font-display text-[#FFF8E8]">Announcement Not Found</h1>
          <p className="text-xs text-[#A5A2AD]">{error || 'Unable to locate this announcement.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C542] text-[#19182B] font-bold text-xs rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Tracker Map</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const venueDisplay = entry.venue_name || entry.landmark_name || entry.district;
  const pubDate = formatDate(entry.approved_at || entry.created_at);
  const sourceLink = entry.source_url || (entry.note?.match(/https?:\/\/[^\s]+/)?.[0]);

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A5A2AD] hover:text-[#F5C542] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tracker Map</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#32304F] text-[#FFF8E8] text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#79d4a8]" />
                <span className="text-[#79d4a8]">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#F5C542]" />
                <span>Share Announcement</span>
              </>
            )}
          </button>
        </div>

        {/* Hero Card Container */}
        <div className="rounded-2xl bg-[#1E1D33] border border-[#32304F] overflow-hidden shadow-2xl">
          {/* Header Image if report is eligible for publication (approved) */}
          {entry.status === 'approved' && (entry.image_url || entry.media_path) && (
            <div className="relative w-full h-64 sm:h-80 bg-[#151424]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.image_url || entry.media_path || ''}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1D33] via-transparent to-transparent" />
            </div>
          )}

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-bold text-[#79d4a8] bg-[#438567]/20 border border-[#438567]/40 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#79d4a8]" />
                Verified Public Appearance
              </span>

              {pubDate && (
                <span className="px-3 py-1 rounded-lg text-xs text-[#A5A2AD] bg-[#222038] border border-[#32304F] flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#A5A2AD]" />
                  <span>Announced on {pubDate}</span>
                </span>
              )}

              {entry.author_display_name && (
                <span className="px-3 py-1 rounded-lg text-xs text-[#FFF8E8] bg-[#222038] border border-[#32304F] flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#F5C542]" />
                  <span>Reported by {entry.author_display_name}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black font-display text-[#FFF8E8] leading-tight">
              {entry.title}
            </h1>

            {/* Venue & Location Banner */}
            <div className="p-4 rounded-xl bg-[#151424] border border-[#32304F] flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#222038] text-[#F16F59] shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-[#A5A2AD] uppercase font-bold block">
                  Public Venue & City
                </span>
                <p className="text-sm font-bold text-[#FFF8E8]">{venueDisplay}</p>
                <p className="text-xs text-[#C5C2CE]">{entry.district}, Tamil Nadu</p>
              </div>
            </div>

            {/* Note / Announcement Description */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#A5A2AD]">
                Announcement Details
              </h3>
              <p className="text-sm text-[#FFF8E8] leading-relaxed bg-[#151424] p-4 rounded-xl border border-[#32304F]">
                {entry.note || entry.description}
              </p>
            </div>

            {/* Public Announcement Source Link */}
            {sourceLink && (
              <div className="pt-2">
                <a
                  href={sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  <span>Read Official Announcement Source</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SignalDetailContent params={params} />;
}
