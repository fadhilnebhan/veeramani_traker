import { TrackerEntry, TrackerFilters, ModerationAction } from '@/types';
import { INITIAL_SAMPLE_SIGNALS } from './sample-signals';

// Global demo store persisted in memory for server runtime
class MemoryDataStore {
  private entries: TrackerEntry[] = [...INITIAL_SAMPLE_SIGNALS];
  private moderationActions: ModerationAction[] = [
    {
      id: 'm1000000-0000-0000-0000-000000000001',
      entry_id: 'sig-1000000-0000-0000-0000-000000000001',
      moderator_id: 'admin-mod-1',
      action: 'approve',
      reason: 'Confirmed creative parody lore with zero real-world stalking elements.',
      created_at: '2026-10-10T10:00:00.000Z',
      entry_title: 'Marina Lighthouse 98.4 MHz Retro Radio Resonance',
      moderator_name: 'Lead Moderator',
    },
  ];
  private rateLimitMap = new Map<string, { count: number; windowStart: number }>();

  // Filter and retrieve tracker entries
  public getEntries(
    filters: TrackerFilters & { city?: string } = {},
    statusFilter: string = 'approved'
  ): TrackerEntry[] {
    return this.entries.filter((item) => {
      // Status check
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // District / City filter
      const districtFilter = filters.district || filters.city;
      if (
        districtFilter &&
        districtFilter !== 'All Districts' &&
        districtFilter !== 'All Cities' &&
        item.district !== districtFilter
      ) {
        return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Signal Strength filter
      if (filters.signalStrength && filters.signalStrength !== 'all') {
        if (filters.signalStrength === 'high' && item.signal_strength < 85) return false;
        if (filters.signalStrength === 'medium' && (item.signal_strength < 50 || item.signal_strength >= 85)) return false;
      }

      // Search query
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDistrict = item.district.toLowerCase().includes(query);
        const matchesLandmark = item.landmark_name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDistrict && !matchesLandmark && !matchesDesc) {
          return false;
        }
      }

      // Bounding box filter
      if (filters.bbox) {
        const { minLat, minLng, maxLat, maxLng } = filters.bbox;
        if (
          item.latitude < minLat ||
          item.latitude > maxLat ||
          item.longitude < minLng ||
          item.longitude > maxLng
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // Backward-compatible alias
  public getEvents(filters: any = {}, statusFilter: string = 'approved'): TrackerEntry[] {
    return this.getEntries(filters, statusFilter);
  }

  public getEntryById(id: string): TrackerEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  // Backward-compatible alias
  public getEventById(id: string): TrackerEntry | undefined {
    return this.getEntryById(id);
  }

  public getEntriesByUser(userId: string): TrackerEntry[] {
    return this.entries.filter((e) => e.author_id === userId);
  }

  // Backward-compatible alias
  public getEventsByUser(userId: string): TrackerEntry[] {
    return this.getEntriesByUser(userId);
  }

  public createEntry(
    data: Omit<TrackerEntry, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at'>,
    userId?: string,
    authorName?: string
  ): TrackerEntry {
    const id = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

    const newEntry: TrackerEntry = {
      ...data,
      id,
      slug,
      is_fictional_confirmed: true,
      status: 'pending',
      city: data.district,
      venue_name: data.landmark_name,
      author_id: userId || 'demo-user-1',
      author_display_name: authorName || data.author_display_name || 'Anonymous Fan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.entries.unshift(newEntry);
    return newEntry;
  }

  // Backward-compatible alias
  public createEvent(data: any, userId?: string, authorName?: string): TrackerEntry {
    const entryData = {
      title: data.title,
      description: data.description,
      category: data.category || 'parody_frequency',
      district: data.district || data.city || 'Chennai',
      landmark_name: data.landmark_name || data.venue_name || 'Public Landmark',
      latitude: data.latitude,
      longitude: data.longitude,
      signal_strength: data.signal_strength || 85,
      frequency_mhz: data.frequency_mhz || 104.2,
      is_fictional_confirmed: true,
      media_path: data.media_path || data.promotional_image_path || null,
      author_id: userId || data.submitted_by || 'demo-user-1',
      author_display_name: authorName || data.submitter_display_name || 'Anonymous Fan',
    };
    return this.createEntry(entryData, userId, authorName);
  }

  public updateEntryStatus(
    id: string,
    action: 'approve' | 'reject' | 'remove',
    reason: string,
    moderatorId: string = 'mod-1'
  ): TrackerEntry | null {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) return null;

    const statusMap: Record<string, TrackerEntry['status']> = {
      approve: 'approved',
      reject: 'rejected',
      remove: 'removed',
    };

    entry.status = statusMap[action];
    entry.moderation_reason = reason;
    entry.updated_at = new Date().toISOString();

    if (action === 'approve') {
      entry.approved_by = moderatorId;
      entry.approved_at = new Date().toISOString();
    }

    const audit: ModerationAction = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entry_id: id,
      event_id: id,
      moderator_id: moderatorId,
      action,
      reason,
      created_at: new Date().toISOString(),
      entry_title: entry.title,
      moderator_name: 'Moderation Team',
    };

    this.moderationActions.unshift(audit);
    return entry;
  }

  // Backward-compatible alias
  public updateEventStatus(
    id: string,
    action: any,
    reason: string,
    moderatorId?: string
  ): TrackerEntry | null {
    return this.updateEntryStatus(id, action, reason, moderatorId);
  }

  public getModerationActions(): ModerationAction[] {
    return this.moderationActions;
  }

  public checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      this.rateLimitMap.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count };
  }

  public resetToDefault(): void {
    this.entries = [...INITIAL_SAMPLE_SIGNALS];
  }
}

// Global singleton instance for server processes
const globalStore = (global as unknown as { __DATA_STORE__?: MemoryDataStore });
if (!globalStore.__DATA_STORE__ || typeof (globalStore.__DATA_STORE__ as any).getEntries !== 'function') {
  globalStore.__DATA_STORE__ = new MemoryDataStore();
}

export const dataStore = globalStore.__DATA_STORE__;
