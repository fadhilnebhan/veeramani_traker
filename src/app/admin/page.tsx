'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { TrackerEntry, ModerationAction, SIGNAL_CATEGORIES } from '@/types';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Radio,
  History,
  Sparkles,
  MapPin
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isDemoMode, loginAsDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'removed'>('pending');
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Action Dialog State
  const [actionEntry, setActionEntry] = useState<TrackerEntry | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'remove' | null>(null);
  const [reason, setReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', activeTab);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || data.events || []);
        setAuditLogs(data.auditLogs || []);
      } else {
        // Fallback to events endpoint
        const res2 = await fetch(`/api/admin/events?${params.toString()}`);
        if (res2.ok) {
          const data2 = await res2.json();
          setEntries(data2.events || []);
          setAuditLogs(data2.auditLogs || []);
        }
      }
    } catch (err) {
      console.error('Error fetching admin parody queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    if (isModerator) {
      loadQueue();
    }
  }, [isModerator, loadQueue]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionEntry || !actionType) return;
    if (reason.trim().length < 3) {
      setActionError('Please provide a meaningful moderation reason (min 3 chars).');
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    try {
      let res = await fetch(`/api/admin/entries/${actionEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          reason,
        }),
      });

      if (!res.ok) {
        // Fallback to events endpoint
        res = await fetch(`/api/admin/events/${actionEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            reason,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Close modal and refresh
      setActionEntry(null);
      setActionType(null);
      setReason('');
      await loadQueue();
    } catch (err: any) {
      setActionError(err.message || 'Failed to execute moderation action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (!isModerator) {
    return (
      <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <ShieldAlert className="w-14 h-14 text-[#F16F59] mx-auto" />
          <h1 className="text-xl font-bold font-display text-[#FFF8E8]">
            Moderator Clearance Required
          </h1>
          <p className="text-xs text-[#A5A2AD]">
            This section is reserved for verified parody radar moderators to review submissions, ensure zero real-world sightings are posted, and enforce anti-stalking policies.
          </p>
          {isDemoMode && (
            <div className="p-4 rounded-xl bg-[#222038] border border-[#32304F] space-y-2 mt-4">
              <span className="text-xs text-[#F5C542] font-semibold block">
                Demo Testing Mode:
              </span>
              <p className="text-[11px] text-[#A5A2AD]">
                You can switch into the Moderator persona with one click to test the moderation dashboard:
              </p>
              <button
                onClick={() => loginAsDemoRole('moderator')}
                className="w-full py-2 bg-[#7D263D] hover:bg-[#9B334E] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Switch to Moderator Persona
              </button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#32304F] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#7D263D] text-[#FFF8E8] border border-[#9B334E]">
                AUTHORIZATION ENFORCED
              </span>
              <span className="text-xs font-mono text-[#F5C542]">ROLE: {user?.role.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-[#FFF8E8]">
              Parody Radar Moderation Desk
            </h1>
            <p className="text-xs text-[#A5A2AD] mt-1">
              Verify community submissions are 100% fictional parody lore, reject any real-world coordinates or personal tracking attempts, and approve for broadcast.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A2AD]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parody transmissions..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#151424] border border-[#32304F] rounded-xl text-xs text-[#FFF8E8] focus:outline-none focus:border-[#F5C542]"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-[#32304F] overflow-x-auto pb-1 text-xs font-semibold">
          {(['pending', 'approved', 'rejected', 'removed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-xl transition-colors uppercase tracking-wider cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#1E1D33] text-[#F5C542] border-t border-l border-r border-[#32304F]'
                  : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
              }`}
            >
              {tab} Queue
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Entries Queue List (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#A5A2AD]">
                Scanning parody queue...
              </div>
            ) : entries.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#1E1D33] border border-[#32304F] text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-[#438567] mx-auto" />
                <h3 className="font-bold text-sm text-[#FFF8E8]">Queue Clear</h3>
                <p className="text-xs text-[#A5A2AD]">
                  No {activeTab} transmissions currently pending review.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-[#1E1D33] border border-[#32304F] space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#151424] text-[#F5C542] border border-[#32304F]">
                      {SIGNAL_CATEGORIES[entry.category]?.label || entry.category}
                    </span>
                    <span className="text-[11px] text-[#A5A2AD] font-mono">
                      Transmitted: {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#FFF8E8]">{entry.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A5A2AD] mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F16F59]" />
                        {entry.landmark_name}, {entry.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-[#F5C542]" />
                        {entry.frequency_mhz || 104.2} MHz ({entry.signal_strength || 85}% Strength)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#A5A2AD] leading-relaxed bg-[#151424] p-3 rounded-xl border border-[#32304F]">
                    {entry.description}
                  </p>

                  {/* Anti-Stalking Policy Compliance Check */}
                  <div className="p-3 rounded-xl bg-[#222038] border border-[#32304F] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#79d4a8]" />
                      <span className="text-[11px] text-[#79d4a8] font-bold">
                        Fictional Parody Certified: Verified zero personal whereabouts or private addresses.
                      </span>
                    </div>
                    {entry.author_display_name && (
                      <span className="text-[10px] text-[#A5A2AD]">
                        By {entry.author_display_name}
                      </span>
                    )}
                  </div>

                  {entry.moderation_reason && (
                    <div className="text-[11px] text-[#A5A2AD]">
                      <strong>Current Moderator Note:</strong> {entry.moderation_reason}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#32304F]">
                    {entry.status !== 'approved' && (
                      <button
                        onClick={() => {
                          setActionEntry(entry);
                          setActionType('approve');
                          setReason('Confirmed creative parody lore with zero real-world stalking elements.');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#438567] hover:bg-[#52A37E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Broadcast</span>
                      </button>
                    )}

                    {entry.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          setActionEntry(entry);
                          setActionType('reject');
                          setReason('Contains potential real-world sighting claims or non-parody content.');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#7D263D] hover:bg-[#9B334E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {entry.status === 'approved' && (
                      <button
                        onClick={() => {
                          setActionEntry(entry);
                          setActionType('remove');
                          setReason('Archived by moderation team.');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#222038] hover:bg-[#7D263D] border border-[#32304F] text-[#FFF8E8] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#F16F59]" />
                        <span>Archive Signal</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Audit History Sidebar (1 col on lg) */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#1E1D33] border border-[#32304F] shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F5C542]">
                <History className="w-4 h-4" />
                <span>Moderation Audit Trail</span>
              </div>
              <p className="text-[11px] text-[#A5A2AD]">
                All broadcast approvals, rejections, and removal decisions are permanently logged.
              </p>

              <div className="space-y-2.5 pt-2 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-[#A5A2AD]">No actions logged yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#151424] border border-[#32304F] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase text-[#F5C542]">{log.action}</span>
                        <span className="text-[#A5A2AD]">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#FFF8E8] font-semibold text-[11px] truncate">
                        {log.entry_title || `Signal ID: ${log.entry_id}`}
                      </p>
                      {log.reason && (
                        <p className="text-[#A5A2AD] text-[10px] italic">
                          &quot;{log.reason}&quot;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Confirmation Modal */}
        {actionEntry && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-[#1E1D33] border border-[#32304F] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#32304F] pb-3">
                <h3 className="font-bold text-base font-display text-[#FFF8E8] capitalize">
                  Confirm {actionType} Action
                </h3>
                <button
                  onClick={() => setActionEntry(null)}
                  className="text-xs text-[#A5A2AD] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-[#A5A2AD]">Signal Title:</p>
                <p className="font-bold text-[#FFF8E8]">{actionEntry.title}</p>
              </div>

              {actionError && (
                <div className="p-2.5 rounded-lg bg-[#F16F59]/20 border border-[#F16F59] text-xs text-[#ff9d8c]">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleExecuteAction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A5A2AD] block">
                    Reason for {actionType} <span className="text-[#F16F59]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter audit log reason..."
                    className="w-full p-2.5 bg-[#151424] border border-[#32304F] rounded-xl text-xs text-[#FFF8E8] focus:outline-none focus:border-[#F5C542]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionEntry(null)}
                    className="px-4 py-2 bg-[#222038] hover:bg-[#32304F] text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? 'Processing...' : `Confirm ${actionType}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
