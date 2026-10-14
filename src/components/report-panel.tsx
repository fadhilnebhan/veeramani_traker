'use client';

import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  X,
  Compass
} from 'lucide-react';
import { containsForbiddenKeywords, getDistrictFromCoords } from '@/lib/validation';
import confetti from 'canvas-confetti';

interface ReportPanelProps {
  onSuccess?: (entry: any) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

const MANUAL_SECTORS = [
  { name: 'Chennai Sector', district: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai Sector', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Coimbatore Sector', district: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Trichy Sector', district: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem Sector', district: 'Salem', lat: 11.6643, lng: 78.1460 },
  { name: 'Tirunelveli Sector', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
  { name: 'Thanjavur Sector', district: 'Thanjavur', lat: 10.7870, lng: 79.1378 },
];

export function ReportPanel({ onSuccess, onClose, isFloating = false }: ReportPanelProps) {
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  // Location states
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'acquired' | 'denied' | 'unsupported'>('idle');
  const [locErrorMsg, setLocErrorMsg] = useState<string | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<any | null>(null);

  // Request browser geolocation on explicit user action
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocStatus('unsupported');
      setLocErrorMsg('Geolocation is not supported by your browser. Please choose an approximate sector.');
      setShowManualPicker(true);
      return;
    }

    setLocLoading(true);
    setLocErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Check if roughly within Tamil Nadu / South India bounds
        let validLat = lat;
        let validLng = lng;
        let district = getDistrictFromCoords(lat, lng);

        if (lat < 8.0 || lat > 14.5 || lng < 76.0 || lng > 81.0) {
          // Outside TN - Snap to closest Tamil Nadu sector for safe demo bounds
          validLat = 13.0827;
          validLng = 80.2707;
          district = 'Chennai';
          setLocationName(`Chennai Sector (Snapped to TN)`);
        } else {
          setLocationName(`${district} Sector (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`);
        }

        setCoords({ lat: validLat, lng: validLng });
        setLocStatus('acquired');
        setLocLoading(false);
        setShowManualPicker(false);
      },
      (error) => {
        setLocLoading(false);
        setLocStatus('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocErrorMsg('Location permission was denied. Select an approximate sector below:');
        } else if (error.code === error.TIMEOUT) {
          setLocErrorMsg('Location request timed out. Select an approximate sector below:');
        } else {
          setLocErrorMsg('Unable to acquire location. Select an approximate sector below:');
        }
        setShowManualPicker(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, []);

  const handleSelectManualSector = (sector: typeof MANUAL_SECTORS[0]) => {
    setCoords({ lat: sector.lat, lng: sector.lng });
    setLocationName(`${sector.name}`);
    setLocStatus('acquired');
    setShowManualPicker(false);
    setLocErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // 1. Validate Note
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError('Please enter a note for the parody signal.');
      return;
    }
    if (trimmed.length < 3) {
      setNoteError('Note must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 280) {
      setNoteError('Note cannot exceed 280 characters.');
      return;
    }
    if (containsForbiddenKeywords(trimmed)) {
      setNoteError(
        'Submissions must only be fictional parody lore. Personal sightings, real coordinates, or private residences are strictly forbidden.'
      );
      return;
    }
    setNoteError(null);

    // 2. Ensure location is chosen or prompt for it
    const activeCoords = coords;
    if (!activeCoords) {
      // If user hasn't requested location yet, trigger location detection
      if (locStatus === 'idle') {
        requestLocation();
        return;
      }
      // If location was denied/failed, require selecting a sector
      setSubmitError('Please select an approximate sector on the map.');
      setShowManualPicker(true);
      return;
    }

    // 3. Send validated submission to backend
    setSubmitting(true);
    try {
      const res = await fetch('/api/tracker-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: trimmed,
          latitude: activeCoords.lat,
          longitude: activeCoords.lng,
          is_fictional_confirmed: true,
          district: getDistrictFromCoords(activeCoords.lat, activeCoords.lng),
          landmark_name: locationName || 'Simulated Signal Sector',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to transmit signal. Please try again.');
      }

      // 4. Success handling: clear note only after successful submission
      const entry = data.entry || data.signal;
      setSubmittedEntry(entry);
      setNote(''); // Clear note on success
      onSuccess?.(entry);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F5C542', '#F16F59', '#438567', '#FFF8E8'],
        });
      } catch {
        // ignore confetti errors
      }
    } catch (err: any) {
      // Note is preserved on failure!
      setSubmitError(err.message || 'Transmission failed. Click Retry below.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSubmittedEntry(null);
    setSubmitError(null);
    setNote('');
    setNoteError(null);
  };

  return (
    <div className={`relative w-full rounded-2xl bg-[#1E1D33] border border-[#32304F] shadow-2xl p-4 sm:p-5 text-[#FFF8E8] ${isFloating ? 'max-w-md' : 'max-w-md mx-auto'}`}>
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
          <Sparkles className="w-4 h-4 text-[#F16F59]" />
        </div>
        <div>
          <h2 className="font-display font-black text-base sm:text-lg text-[#FFF8E8] leading-tight">
            Report a Signal
          </h2>
          <span className="text-[10px] text-[#A5A2AD] font-mono uppercase tracking-wider block">
            Fictional Parody Lore • 104.2 MHz
          </span>
        </div>
      </div>

      {submittedEntry ? (
        /* Success Feedback State */
        <div className="p-4 rounded-xl bg-[#151424] border border-[#438567]/50 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-10 h-10 rounded-full bg-[#438567]/20 border border-[#438567] flex items-center justify-center text-[#79d4a8] mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#438567]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FFF8E8]">Signal Transmitted!</h3>
            <p className="text-xs text-[#A5A2AD] mt-1 leading-relaxed">
              Your fictional parody note has been sent to the moderation queue. Review pending!
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#1E1D33] border border-[#32304F] text-[11px] text-left text-[#C5C2CE] font-mono space-y-1">
            <div className="truncate"><strong className="text-[#F5C542]">Note:</strong> &quot;{submittedEntry.description || submittedEntry.title}&quot;</div>
            <div><strong className="text-[#F5C542]">Sector:</strong> {submittedEntry.district} ({submittedEntry.latitude.toFixed(2)}°N, {submittedEntry.longitude.toFixed(2)}°E)</div>
            <div><strong className="text-[#F5C542]">Status:</strong> <span className="text-[#F5C542] uppercase font-bold">Pending Approval</span></div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleResetForAnother}
              className="flex-1 py-2 px-3 bg-[#222038] hover:bg-[#32304F] text-xs font-semibold text-[#FFF8E8] rounded-xl transition-colors cursor-pointer"
            >
              Drop Another Note
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="py-2 px-4 bg-[#F5C542] hover:bg-[#D4A325] text-xs font-bold text-[#19182B] rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Streamlined Input Form */
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Note Input */}
          <div className="space-y-1">
            <textarea
              rows={2}
              maxLength={280}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              placeholder="Drop a funny note here... (e.g. Tea glass clinking rhythm detected near Marina)"
              className={`w-full px-3 py-2 bg-[#151424] border rounded-xl text-xs sm:text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none transition-colors resize-none ${
                noteError ? 'border-[#F16F59] focus:border-[#F16F59]' : 'border-[#32304F] focus:border-[#F5C542]'
              }`}
            />
            <div className="flex items-center justify-between text-[10px] text-[#A5A2AD]">
              <span>100% fictional satire • No real sightings</span>
              <span className={note.length > 250 ? 'text-[#F16F59]' : ''}>{note.length}/280</span>
            </div>
            {noteError && (
              <p className="text-[11px] text-[#F16F59] flex items-center gap-1 pt-0.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{noteError}</span>
              </p>
            )}
          </div>

          {/* Location Controls */}
          <div className="space-y-2 pt-1 border-t border-[#32304F]/60">
            {locStatus === 'acquired' && coords ? (
              <div className="p-2.5 rounded-xl bg-[#151424] border border-[#438567]/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#438567] shrink-0" />
                  <span className="text-[#FFF8E8] font-medium text-[11px] truncate">{locationName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualPicker(!showManualPicker)}
                  className="text-[10px] text-[#F5C542] hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locLoading}
                  className="w-full py-2 px-3 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#32304F] hover:border-[#F5C542]/50 text-xs text-[#FFF8E8] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {locLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5C542]" />
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#F16F59]" />
                      <span>📍 Use My Location</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[#A5A2AD] text-center mt-1">
                  Location is optional & used solely for placing your fictional signal on the parody map.
                </p>
              </div>
            )}

            {/* Error or Denied explanation */}
            {locErrorMsg && (
              <div className="text-[11px] text-[#F16F59] p-2 bg-[#F16F59]/10 rounded-lg border border-[#F16F59]/20 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{locErrorMsg}</span>
              </div>
            )}

            {/* Manual Sector Picker (Fallback) */}
            {showManualPicker && (
              <div className="p-2.5 rounded-xl bg-[#151424] border border-[#32304F] space-y-2 animate-in fade-in duration-150">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C542] flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>Select Approximate Tamil Nadu Sector:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {MANUAL_SECTORS.map((sec) => (
                    <button
                      key={sec.name}
                      type="button"
                      onClick={() => handleSelectManualSector(sec)}
                      className="px-2 py-1 rounded-lg text-[10px] bg-[#222038] hover:bg-[#F5C542] hover:text-[#19182B] text-[#FFF8E8] border border-[#32304F] transition-colors cursor-pointer"
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-2.5 rounded-xl bg-[#F16F59]/15 border border-[#F16F59] text-xs text-[#ff9d8c] flex items-center justify-between gap-2">
              <span className="text-[11px]">{submitError}</span>
              <button
                type="submit"
                className="px-2 py-1 bg-[#F16F59] text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Prominent Turmeric-Yellow Report Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#19182B]" />
                <span>Transmitting Signal...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#19182B]" />
                <span>REPORT SIGNAL</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
