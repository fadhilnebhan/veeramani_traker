'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { TrackerEntry, SIGNAL_CATEGORIES } from '@/types';
import Link from 'next/link';
import {
  Share2,
  Sparkles,
  User,
  AlertCircle,
  ArrowLeft,
  Radio,
  MapPin,
  AlertTriangle,
  Activity
} from 'lucide-react';

function SignalDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [entry, setEntry] = useState<TrackerEntry | null>(null);
  const [related, setRelated] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSignal() {
      setLoading(true);
      try {
        let res = await fetch(`/api/tracker-entries/${id}`);
        if (!res.ok) {
          // Fallback to legacy events endpoint
          res = await fetch(`/api/events/${id}`);
        }
        if (!res.ok) {
          throw new Error('This parody signal was not found or has been archived.');
        }
        const data = await res.json();
        setEntry(data.entry || data.event);
        setRelated(data.related || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load parody signal details.');
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
          title: `${entry.title} - Veeramani Tracker Parody`,
          text: `Check out this fictional parody radar ping in ${entry.district}: ${entry.title}`,
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
          <p className="text-sm font-semibold text-[#F5C542] font-mono">Scanning signal dossier...</p>
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
          <h1 className="text-xl font-bold font-display text-[#FFF8E8]">Parody Signal Not Found</h1>
          <p className="text-xs text-[#A5A2AD]">{error || 'Unable to tune into this signal.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C542] text-[#19182B] font-bold text-xs rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Parody Radar</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const catMeta = SIGNAL_CATEGORIES[entry.category] || {
    label: entry.category,
    color: '#F5C542',
    tamil: 'நையாண்டி',
  };

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
            <span>Back to Parody Radar Map</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#32304F] text-[#FFF8E8] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#F5C542]" />
            <span>{copied ? 'Link Copied!' : 'Share Signal'}</span>
          </button>
        </div>

        {/* Hero Card / Signal Dossier Container */}
        <div className="rounded-2xl bg-[#1E1D33] border border-[#32304F] overflow-hidden shadow-2xl">
          {/* Header Banner */}
          {entry.media_path ? (
            <div className="relative w-full h-64 sm:h-80 bg-[#151424]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.media_path}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1D33] via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full h-32 sm:h-40 bg-gradient-to-r from-[#222038] via-[#1E1D33] to-[#7D263D]/40 border-b border-[#32304F] flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#F5C542]/10 border border-[#F5C542]/30 text-[#F5C542]">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#F16F59] font-mono block">
                    100% FICTIONAL DEMO
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#FFF8E8] font-display">
                    Parody Radar Signal Dossier
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end text-xs font-mono text-[#A5A2AD]">
                <span>{entry.frequency_mhz || 104.2} MHz</span>
                <span className="text-[#79d4a8]">{entry.signal_strength || 85}% Intensity</span>
              </div>
            </div>
          )}

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Status & Category Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  color: catMeta.color,
                  borderColor: `${catMeta.color}50`,
                  backgroundColor: `${catMeta.color}15`,
                }}
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-lg border"
              >
                {catMeta.label} ({catMeta.tamil})
              </span>

              <span className="px-3 py-1 rounded-lg text-xs font-bold text-[#79d4a8] bg-[#438567]/20 border border-[#438567]/40 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#F5C542]" />
                Simulated Demonstration Ping
              </span>

              {entry.author_display_name && (
                <span className="px-3 py-1 rounded-lg text-xs text-[#FFF8E8] bg-[#222038] border border-[#32304F] flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#F5C542]" />
                  <span>Transmitted by {entry.author_display_name}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-[#FFF8E8] leading-tight">
              {entry.title}
            </h1>

            {/* Signal Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#151424] border border-[#32304F]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#222038] text-[#F16F59]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#A5A2AD] uppercase font-bold block">Landmark Sector & District</span>
                  <p className="text-sm font-bold text-[#FFF8E8]">{entry.landmark_name}</p>
                  <p className="text-xs text-[#C5C2CE]">{entry.district}, Tamil Nadu</p>
                  <p className="text-[10px] text-[#A5A2AD] font-mono mt-0.5">
                    Coords: {entry.latitude.toFixed(4)}° N, {entry.longitude.toFixed(4)}° E (Simulated Pin)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#222038] text-[#F5C542]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#A5A2AD] uppercase font-bold block">Signal Telemetry</span>
                  <p className="text-sm font-bold text-[#FFF8E8] font-mono">
                    {entry.frequency_mhz || 104.2} MHz Radar Frequency
                  </p>
                  <p className="text-xs text-[#79d4a8] font-mono">
                    {entry.signal_strength || 85}% Simulated Mass Resonance
                  </p>
                  <p className="text-[10px] text-[#A5A2AD] mt-0.5">
                    Logged: {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description / Creative Parody Lore */}
            <div className="space-y-2">
              <h2 className="text-xs uppercase font-bold tracking-wider text-[#F5C542] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F16F59]" />
                <span>Parody Lore & Demonstration Record</span>
              </h2>
              <div className="p-4 rounded-xl bg-[#151424] border border-[#32304F] text-sm sm:text-base text-[#C5C2CE] leading-relaxed">
                {entry.description}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/"
                className="flex-1 min-w-[200px] py-3 px-4 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-sm rounded-xl text-center transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Radio className="w-4 h-4" />
                <span>Locate on Interactive Radar</span>
              </Link>

              <button
                onClick={handleShare}
                className="py-3 px-5 bg-[#222038] hover:bg-[#32304F] border border-[#32304F] text-[#FFF8E8] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#F5C542]" />
                <span>{copied ? 'Link Copied!' : 'Share Signal Lore'}</span>
              </button>
            </div>

            {/* Strict Fictional Boundary Disclaimer */}
            <div className="p-4 rounded-xl bg-[#151424] border border-[#7D263D]/40 text-xs text-[#A5A2AD] leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F16F59] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F16F59] block mb-1">
                  Parody Tracker Legal & Privacy Boundary:
                </strong>
                This entry is purely fictional parody lore and creative internet satire. It does NOT claim to reveal Veeramani&apos;s actual whereabouts, residence, or current movements.
                Real-world sightings and private location tracking are strictly forbidden on this platform.
              </div>
            </div>
          </div>
        </div>

        {/* Related Parody Signals Section */}
        {related.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-lg font-bold font-display text-[#FFF8E8]">
              More Parody Signals in {entry.district}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/event/${rel.id}`}
                  className="p-3.5 rounded-xl bg-[#1E1D33] border border-[#32304F] hover:border-[#F5C542] transition-colors block group"
                >
                  <span className="text-[10px] font-bold text-[#F5C542] uppercase block mb-1">
                    {SIGNAL_CATEGORIES[rel.category]?.label || rel.category}
                  </span>
                  <h3 className="text-xs font-bold text-[#FFF8E8] group-hover:text-[#F5C542] line-clamp-2 mb-1">
                    {rel.title}
                  </h3>
                  <span className="text-[11px] text-[#A5A2AD] font-mono">
                    {rel.frequency_mhz || 104.2} MHz
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SignalDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
          <Navbar />
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#F5C542] border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#F5C542] font-mono">Loading signal dossier...</p>
          </main>
          <Footer />
        </div>
      }
    >
      <SignalDetailContent {...props} />
    </Suspense>
  );
}
