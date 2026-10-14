'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { TrackerEntry, SIGNAL_CATEGORIES } from '@/types';
import Link from 'next/link';
import {
  User,
  CheckCircle2,
  Clock,
  XCircle,
  AlertOctagon,
  Radio,
  MapPin,
  ExternalLink,
  Edit2,
  Save,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export default function AccountPage() {
  const { user, isDemoMode, updateProfile, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile states
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [showAttribution, setShowAttribution] = useState(user?.show_public_attribution || false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setShowAttribution(user.show_public_attribution);
    }
  }, [user]);

  useEffect(() => {
    async function loadAccountSubmissions() {
      setLoading(true);
      try {
        const res = await fetch('/api/account/entries');
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || data.entries || []);
        } else {
          // Fallback to legacy events endpoint
          const res2 = await fetch('/api/account/events');
          if (res2.ok) {
            const data2 = await res2.json();
            setSubmissions(data2.submissions || []);
          }
        }
      } catch (err) {
        console.error('Failed to load user transmissions', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountSubmissions();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(displayName, showAttribution);
    if (success) {
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const getStatusBadge = (status: TrackerEntry['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#438567]/20 text-[#79d4a8] border border-[#438567]/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#438567]" />
            Broadcasting Live
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5C542]/20 text-[#F5C542] border border-[#F5C542]/40">
            <Clock className="w-3.5 h-3.5 text-[#F5C542]" />
            Pending Parody Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F16F59]/20 text-[#ff9d8c] border border-[#F16F59]/40">
            <XCircle className="w-3.5 h-3.5 text-[#F16F59]" />
            Rejected
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7D263D]/30 text-[#ff9d8c] border border-[#7D263D]">
            <AlertOctagon className="w-3.5 h-3.5 text-[#F16F59]" />
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#32304F] text-[#A5A2AD]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card */}
        <div className="rounded-2xl bg-[#1E1D33] border border-[#32304F] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#32304F] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F5C542] to-[#D4A325] text-[#19182B] flex items-center justify-center font-bold text-xl shadow-md">
                <User className="w-6 h-6 stroke-[#19182B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display text-[#FFF8E8]">
                    {user?.display_name || 'Parody Contributor'}
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#222038] border border-[#32304F] text-[#F5C542]">
                    {user?.role || 'User'}
                  </span>
                </div>
                <p className="text-xs text-[#A5A2AD]">
                  {isDemoMode
                    ? 'Demo Profile Active (Simulated Parody Contributor)'
                    : 'Authenticated Supabase User'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#222038] hover:bg-[#32304F] border border-[#32304F] text-xs font-semibold text-[#FFF8E8] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#F5C542]" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl bg-[#7D263D]/20 hover:bg-[#7D263D]/40 border border-[#7D263D]/40 text-xs font-semibold text-[#ff9d8c] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Edit Profile Form */}
          {editing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A5A2AD] block">
                    Public Contributor Handle
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs text-[#FFF8E8] focus:outline-none"
                    placeholder="Enter your parody radar alias"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C5C2CE]">
                    <input
                      type="checkbox"
                      checked={showAttribution}
                      onChange={(e) => setShowAttribution(e.target.checked)}
                      className="w-4 h-4 rounded text-[#F5C542] bg-[#151424] border-[#32304F]"
                    />
                    <span>Allow my handle to appear on approved parody signals</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-[#222038] hover:bg-[#32304F] text-[#A5A2AD] text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-xs text-[#A5A2AD] flex flex-wrap gap-4 pt-1">
              <div>
                Attribution Preference:{' '}
                <strong className="text-[#FFF8E8]">
                  {showAttribution ? 'Public Attribution Enabled' : 'Anonymous Satire'}
                </strong>
              </div>
              {saveSuccess && (
                <span className="text-[#79d4a8] font-bold">Profile updated successfully!</span>
              )}
            </div>
          )}
        </div>

        {/* Submissions List Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-[#FFF8E8]">
              My Parody Transmissions
            </h2>
            <p className="text-xs text-[#A5A2AD]">
              Track the moderation and broadcast status of your contributed parody lore
            </p>
          </div>

          <Link
            href="/submit"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Transmit New Signal</span>
          </Link>
        </div>

        {/* Submissions Content */}
        {loading ? (
          <div className="p-8 text-center text-xs text-[#A5A2AD]">
            Scanning user signal archive...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#1E1D33] border border-[#32304F] text-center space-y-3">
            <Radio className="w-10 h-10 text-[#F5C542]/40 mx-auto" />
            <p className="text-sm font-semibold text-[#FFF8E8]">
              No parody signal transmissions recorded yet.
            </p>
            <p className="text-xs text-[#A5A2AD] max-w-sm mx-auto">
              Got a funny Tamil Nadu cinema myth, tea shop debate, or slow-motion sunglasses rumor? Transmit a parody signal to broadcast it!
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5C542] text-[#19182B] font-bold text-xs rounded-xl mt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Transmit First Parody Signal</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#1E1D33] border border-[#32304F] space-y-3 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#151424] text-[#F5C542] border border-[#32304F]">
                      {SIGNAL_CATEGORIES[item.category]?.label || item.category}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <span className="text-[11px] text-[#A5A2AD]">
                    Transmitted {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#FFF8E8]">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#A5A2AD] mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#F16F59]" />
                      {item.landmark_name}, {item.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[#F5C542]" />
                      {item.frequency_mhz || 104.2} MHz ({item.signal_strength || 85}% Strength)
                    </span>
                  </div>
                </div>

                {/* Moderation notes */}
                {item.moderation_reason && (
                  <div className="p-3 rounded-xl bg-[#151424] border border-[#32304F] text-xs">
                    <strong className="text-[#F5C542] block mb-0.5">Parody Desk Reviewer Notes:</strong>
                    <p className="text-[#C5C2CE]">{item.moderation_reason}</p>
                  </div>
                )}

                {item.status === 'approved' && (
                  <div className="pt-1">
                    <Link
                      href={`/event/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5C542] hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F16F59]" />
                      <span>View Live Signal Dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
