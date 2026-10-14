'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { trackerSubmissionSchema, TrackerSubmissionFormValues } from '@/lib/validation';
import { SIGNAL_CATEGORIES, TAMIL_NADU_DISTRICTS, SignalCategory } from '@/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  ShieldAlert,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Radio
} from 'lucide-react';

// Default Tamil Nadu district centers for quick selection
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Salem: { lat: 11.6643, lng: 78.1460 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Thanjavur: { lat: 10.7870, lng: 79.1378 },
  Erode: { lat: 11.3410, lng: 77.7172 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Dindigul: { lat: 10.3673, lng: 77.9803 },
  Kanchipuram: { lat: 12.8342, lng: 79.7036 },
  Kanyakumari: { lat: 8.0883, lng: 77.5385 },
  Cuddalore: { lat: 11.7480, lng: 79.7714 },
};

export default function SubmitSignalPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successEntry, setSuccessEntry] = useState<any | null>(null);

  const zodFormResolver = async (data: any) => {
    const result = trackerSubmissionSchema.safeParse(data);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const formErrors: Record<string, any> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (!formErrors[key]) {
        formErrors[key] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }
    return { values: {}, errors: formErrors };
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TrackerSubmissionFormValues>({
    resolver: zodFormResolver as any,
    defaultValues: {
      category: 'cinematic_echo',
      district: 'Chennai',
      landmark_name: '',
      latitude: 13.0827,
      longitude: 80.2707,
      signal_strength: 85,
      frequency_mhz: 104.2,
      is_fictional_confirmed: true,
      show_public_attribution: user?.show_public_attribution || false,
      author_display_name: user?.display_name || '',
    },
  });

  const selectedDistrict = watch('district');
  const showAttribution = watch('show_public_attribution');
  const signalStrength = watch('signal_strength');

  const handleDistrictSelect = (districtName: string) => {
    setValue('district', districtName);
    if (DISTRICT_COORDS[districtName]) {
      setValue('latitude', DISTRICT_COORDS[districtName].lat);
      setValue('longitude', DISTRICT_COORDS[districtName].lng);
    }
  };

  const onSubmit = async (values: TrackerSubmissionFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/tracker-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit parody signal.');
      }

      setSuccessEntry(result.entry || result.event);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F5C542', '#F16F59', '#438567', '#FFF8E8'],
        });
      } catch {
        // ignore confetti errors
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during parody signal transmission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A5A2AD] hover:text-[#F5C542] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Parody Radar</span>
          </Link>
        </div>

        {/* Success Confirmation Card */}
        {successEntry ? (
          <div className="p-8 rounded-3xl bg-[#1E1D33] border border-[#438567] text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#438567]/20 border-2 border-[#438567] text-[#79d4a8] flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-[#438567]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#438567]/20 text-[#79d4a8] border border-[#438567]/40">
                PARODY TRANSMISSION RECEIVED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-[#FFF8E8] mt-3">
                Submission received. Review pending!
              </h2>
              <p className="text-xs sm:text-sm text-[#C5C2CE] max-w-lg mx-auto mt-2 leading-relaxed">
                Nandri! Your fictional parody lore transmission for <strong>{successEntry.title}</strong> has been logged in the moderation queue.
                Once confirmed that it contains 0 real sightings or private coordinates, it will be broadcasted to the live parody map.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#151424] border border-[#32304F] text-xs text-[#A5A2AD] max-w-md mx-auto text-left space-y-1 font-mono">
              <div><strong>Status:</strong> <span className="text-[#F5C542] uppercase font-bold">Pending Parody Review</span></div>
              <div><strong>Sector:</strong> {successEntry.landmark_name}, {successEntry.district}</div>
              <div><strong>Frequency:</strong> {successEntry.frequency_mhz || 104.2} MHz</div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/account"
                className="px-5 py-2.5 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl transition-colors"
              >
                View in My Transmissions
              </Link>
              <button
                onClick={() => setSuccessEntry(null)}
                className="px-5 py-2.5 bg-[#222038] hover:bg-[#32304F] border border-[#32304F] text-[#FFF8E8] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Transmit Another Signal
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded bg-[#7D263D] text-[#FFF8E8] border border-[#9B334E]">
                  COMMUNITY RADAR DESK
                </span>
                <span className="text-xs text-[#F5C542] font-mono">FICTIONAL LORE TRANSMISSION</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-[#FFF8E8]">
                Transmit a Parody Signal
              </h1>
              <p className="text-xs sm:text-sm text-[#A5A2AD] mt-1">
                Got a humorous Tamil internet myth, mass dialogue echo, or tea stall parody lore? Transmit your fictional radar signal below.
              </p>
            </div>

            {/* Strict Anti-Stalking Parody Policy Alert */}
            <div className="p-4 rounded-2xl bg-[#7D263D]/25 border border-[#7D263D] flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#F16F59] shrink-0 mt-0.5" />
              <div className="text-xs text-[#FFF8E8]/90 leading-relaxed">
                <strong className="text-[#F16F59] block mb-0.5">
                  STRICT PARODY & ANTI-STALKING BOUNDARY:
                </strong>
                Veeramani Tracker is strictly an entertainment parody. Submissions claiming real-world coordinates, personal movements, private residences, hotels, paparazzi photos, or actual sightings are automatically rejected and IP-blocked. Submissions must be 100% fictional humor.
              </div>
            </div>

            {submitError && (
              <div className="p-4 rounded-xl bg-[#F16F59]/20 border border-[#F16F59] text-xs text-[#ff9d8c] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-[#1E1D33] border border-[#32304F] p-5 sm:p-7 shadow-xl">
              {/* Signal Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#FFF8E8] block">
                  Parody Signal Title <span className="text-[#F16F59]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marina Lighthouse 98.4 MHz Retro Radio Resonance"
                  {...register('title')}
                  className="w-full px-4 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none"
                />
                {errors.title && (
                  <p className="text-[11px] text-[#F16F59]">{errors.title.message}</p>
                )}
              </div>

              {/* Category & District Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#FFF8E8] block">
                    Parody Signal Category <span className="text-[#F16F59]">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] focus:outline-none cursor-pointer"
                  >
                    {(Object.keys(SIGNAL_CATEGORIES) as SignalCategory[]).map((cat) => (
                      <option key={cat} value={cat} className="bg-[#19182B] text-[#FFF8E8]">
                        {SIGNAL_CATEGORIES[cat].label} ({SIGNAL_CATEGORIES[cat].tamil})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#FFF8E8] block">
                    District (Tamil Nadu) <span className="text-[#F16F59]">*</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] focus:outline-none cursor-pointer"
                  >
                    {TAMIL_NADU_DISTRICTS.filter((d) => d !== 'All Districts').map((dist) => (
                      <option key={dist} value={dist} className="bg-[#19182B] text-[#FFF8E8]">
                        {dist}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="text-[11px] text-[#F16F59]">{errors.district.message}</p>
                  )}
                </div>
              </div>

              {/* Public Landmark Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#FFF8E8] block">
                  Public Landmark or Sector <span className="text-[#F16F59]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marina Beach Promenade, R.S. Puram Tea Corner"
                  {...register('landmark_name')}
                  className="w-full px-4 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none"
                />
                <p className="text-[11px] text-[#A5A2AD]">
                  Must be a recognizable public area or cultural spot. Private residences are strictly rejected.
                </p>
                {errors.landmark_name && (
                  <p className="text-[11px] text-[#F16F59]">{errors.landmark_name.message}</p>
                )}
              </div>

              {/* Coordinates (Auto-populated by district) */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-[#151424] rounded-xl border border-[#32304F]">
                <div>
                  <label className="text-[11px] font-mono text-[#A5A2AD] block">Latitude (TN: 8.0 - 14.5)</label>
                  <input
                    type="number"
                    step="0.0001"
                    {...register('latitude', { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-[#1E1D33] border border-[#32304F] rounded text-xs text-[#FFF8E8]"
                  />
                  {errors.latitude && (
                    <p className="text-[10px] text-[#F16F59]">{errors.latitude.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#A5A2AD] block">Longitude (TN: 76.0 - 81.0)</label>
                  <input
                    type="number"
                    step="0.0001"
                    {...register('longitude', { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-[#1E1D33] border border-[#32304F] rounded text-xs text-[#FFF8E8]"
                  />
                  {errors.longitude && (
                    <p className="text-[10px] text-[#F16F59]">{errors.longitude.message}</p>
                  )}
                </div>
              </div>

              {/* Frequency MHz & Signal Strength HUD Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#222038] border border-[#32304F]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F5C542] flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Frequency (MHz)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="80"
                    max="110"
                    {...register('frequency_mhz', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-[#151424] border border-[#32304F] rounded-lg text-xs font-mono text-[#FFF8E8] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#A5A2AD]">e.g. 104.2 MHz Parody Radar</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#79d4a8]">
                    <span>Signal Strength ({signalStrength || 85}%)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    {...register('signal_strength', { valueAsNumber: true })}
                    className="w-full accent-[#F5C542] cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#A5A2AD]">
                    <span>Faint Echo (10%)</span>
                    <span>Mass Resonance (100%)</span>
                  </div>
                </div>
              </div>

              {/* Description / Creative Lore */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#FFF8E8] block">
                  Creative Parody Lore Description <span className="text-[#F16F59]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the humorous folklore, tea shop debate, slow-motion sunglasses echo, or viral soundwave registered here..."
                  {...register('description')}
                  className="w-full px-4 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none"
                />
                {errors.description && (
                  <p className="text-[11px] text-[#F16F59]">{errors.description.message}</p>
                )}
              </div>

              {/* Optional Permitted Illustrative Media */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#A5A2AD] block">
                  Illustrative / Parody Media URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/parody-art.jpg"
                  {...register('media_path')}
                  className="w-full px-4 py-2 bg-[#151424] border border-[#32304F] rounded-xl text-xs text-[#FFF8E8] focus:outline-none"
                />
                <p className="text-[11px] text-[#A5A2AD]">
                  Only creative fan artwork, authorized promotional imagery, or satirical illustrations. Sighting photos or personal photographs are strictly prohibited.
                </p>
              </div>

              {/* Contributor Attribution Consent */}
              <div className="p-3 bg-[#151424] rounded-xl border border-[#32304F] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('show_public_attribution')}
                    className="w-4 h-4 rounded text-[#F5C542] focus:ring-0 bg-[#1E1D33] border-[#32304F]"
                  />
                  <span className="text-xs text-[#FFF8E8]">
                    Display my contributor handle publicly if this parody signal is approved
                  </span>
                </label>

                {showAttribution && (
                  <div className="pt-2 pl-6">
                    <label className="text-[11px] text-[#A5A2AD] block mb-1">
                      Public Handle / Alias
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MarinaSignalScout"
                      {...register('author_display_name')}
                      className="w-full sm:w-64 px-3 py-1.5 bg-[#1E1D33] border border-[#32304F] rounded-lg text-xs text-[#FFF8E8] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Mandatory Parody Confirmation Checkbox */}
              <div className="p-4 rounded-xl bg-[#F5C542]/10 border border-[#F5C542]/40 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_fictional_confirmed')}
                    defaultChecked={true}
                    className="w-4 h-4 mt-0.5 rounded text-[#F5C542] focus:ring-0 bg-[#1E1D33] border-[#32304F]"
                  />
                  <div className="text-xs leading-relaxed text-[#FFF8E8]">
                    <strong className="text-[#F5C542] block">
                      Mandatory Parody Certification <span className="text-[#F16F59]">*</span>
                    </strong>
                    I certify that this submission is 100% fictional satire and community folklore. It does NOT claim to reveal the actual whereabouts, current coordinates, or private details of Veeramani or anyone else.
                  </div>
                </label>
                {errors.is_fictional_confirmed && (
                  <p className="text-[11px] text-[#F16F59] pl-6">{errors.is_fictional_confirmed.message}</p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Transmitting to Parody Moderation Desk...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Parody Signal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
