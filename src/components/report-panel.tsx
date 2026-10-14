'use client';

import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  X,
  ShieldCheck
} from 'lucide-react';
import { extractSourceUrl, isTrustedSourceUrl } from '@/lib/trusted-sources';
import { containsForbiddenKeywords } from '@/lib/validation';
import confetti from 'canvas-confetti';

interface ReportPanelProps {
  onSuccess?: (entry: any) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

export function ReportPanel({ onSuccess, onClose, isFloating = false }: ReportPanelProps) {
  const [reportText, setReportText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedEntry, setPublishedEntry] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = reportText.trim();
    if (!trimmed) {
      setErrorMessage('Please enter the announcement details with city or venue and source link.');
      return;
    }
    if (trimmed.length < 10) {
      setErrorMessage('Please provide more detail (at least 10 characters).');
      return;
    }
    if (trimmed.length > 500) {
      setErrorMessage('Announcement note cannot exceed 500 characters.');
      return;
    }

    // 1. Check Anti-Stalking Policy
    if (containsForbiddenKeywords(trimmed)) {
      setErrorMessage(
        'Only intentionally announced public appearances are permitted. Private whereabouts, hotel rooms, residences, and unverified tracking are strictly forbidden.'
      );
      return;
    }

    // 2. Validate Trusted Source URL
    const detectedUrl = extractSourceUrl(trimmed);
    if (!detectedUrl) {
      setErrorMessage(
        'A link to an intentionally announced public appearance is required for publication (e.g. news report, official press, event platform).'
      );
      return;
    }

    if (!isTrustedSourceUrl(detectedUrl)) {
      setErrorMessage(
        'The announcement link must be from an authorized source (e.g. The Hindu, Dinamalar, Times of India, Cinema Express, Vikatan, BookMyShow, official press channels).'
      );
      return;
    }

    // 3. Submit to backend
    setSubmitting(true);
    try {
      const res = await fetch('/api/tracker-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_text: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish announcement. Please check details and try again.');
      }

      const entry = data.entry || data.signal;
      setPublishedEntry(entry);
      setReportText(''); // Clear input on success
      onSuccess?.(entry);

      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#F5C542', '#438567', '#FFF8E8'],
        });
      } catch {
        // ignore confetti errors
      }
    } catch (err: any) {
      // Input text is preserved on error!
      setErrorMessage(err.message || 'Submission failed. Please click retry below.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPublishedEntry(null);
    setErrorMessage(null);
    setReportText('');
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-[#1E1D33] border border-[#32304F] shadow-2xl p-4 sm:p-5 text-[#FFF8E8] ${
        isFloating ? 'max-w-md' : 'max-w-md mx-auto'
      }`}
    >
      {/* Floating Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-[#A5A2AD] hover:text-[#FFF8E8] hover:bg-[#32304F] transition-colors cursor-pointer"
          aria-label="Close report panel"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#F5C542]/15 border border-[#F5C542]/30 flex items-center justify-center text-[#F5C542]">
          <ShieldCheck className="w-4 h-4 text-[#F5C542]" />
        </div>
        <div>
          <h2 className="font-display font-black text-base sm:text-lg text-[#FFF8E8] leading-tight">
            Report a public appearance
          </h2>
          <span className="text-[10px] text-[#A5A2AD] font-mono block">
            Trusted public announcements only • Published directly to map
          </span>
        </div>
      </div>

      {publishedEntry ? (
        /* Instant Publication Success Feedback */
        <div className="p-4 rounded-xl bg-[#151424] border border-[#438567]/50 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-10 h-10 rounded-full bg-[#438567]/20 border border-[#438567] flex items-center justify-center text-[#79d4a8] mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#438567]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FFF8E8]">Pin Published to Map!</h3>
            <p className="text-xs text-[#A5A2AD] mt-1 leading-relaxed">
              Trusted announcement verified. The public pin is now visible across Tamil Nadu.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#1E1D33] border border-[#32304F] text-[11px] text-left text-[#C5C2CE] font-mono space-y-1">
            <div className="truncate">
              <strong className="text-[#F5C542]">Venue:</strong> {publishedEntry.landmark_name || publishedEntry.venue_name || publishedEntry.district}
            </div>
            <div>
              <strong className="text-[#F5C542]">City:</strong> {publishedEntry.district || publishedEntry.city}
            </div>
            {publishedEntry.source_url && (
              <div className="truncate">
                <strong className="text-[#F5C542]">Source:</strong>{' '}
                <a
                  href={publishedEntry.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#79d4a8] hover:underline"
                >
                  {publishedEntry.source_url}
                </a>
              </div>
            )}
            <div>
              <strong className="text-[#F5C542]">Status:</strong>{' '}
              <span className="text-[#79d4a8] uppercase font-bold">Live on Map</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-3 bg-[#222038] hover:bg-[#32304F] text-xs font-semibold text-[#FFF8E8] rounded-xl transition-colors cursor-pointer"
            >
              Report Another
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="py-2 px-4 bg-[#F5C542] hover:bg-[#D4A325] text-xs font-bold text-[#19182B] rounded-xl transition-colors cursor-pointer"
              >
                View on Map
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Single multiline input + Large REPORT button */
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <textarea
              rows={4}
              maxLength={500}
              value={reportText}
              onChange={(e) => {
                setReportText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="City or public venue + short note + link to the public announcement..."
              className={`w-full px-3 py-2.5 bg-[#151424] border rounded-xl text-xs sm:text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none transition-colors resize-none leading-relaxed ${
                errorMessage ? 'border-[#F16F59] focus:border-[#F16F59]' : 'border-[#32304F] focus:border-[#F5C542]'
              }`}
            />
            <div className="flex items-center justify-between text-[10px] text-[#A5A2AD]">
              <span>Include announcement link from news or official organizer</span>
              <span className={reportText.length > 450 ? 'text-[#F16F59]' : ''}>{reportText.length}/500</span>
            </div>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-[#F16F59]/15 border border-[#F16F59] text-xs text-[#ff9d8c] flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 text-[11px] leading-tight">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="submit"
                className="px-2 py-0.5 bg-[#F16F59] text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Large Turmeric-Yellow REPORT Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#19182B]" />
                <span>Verifying Announcement...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#19182B]" />
                <span>REPORT</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
