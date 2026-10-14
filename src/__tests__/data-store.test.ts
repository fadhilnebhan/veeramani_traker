import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/data-store';

describe('Parody Data Store & Filtering Behavior', () => {
  beforeEach(() => {
    dataStore.resetToDefault();
  });

  it('retrieves sample approved parody signals across Tamil Nadu', () => {
    const entries = dataStore.getEntries({}, 'approved');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.status === 'approved')).toBe(true);
  });

  it('filters parody signals accurately by district', () => {
    const chennaiSignals = dataStore.getEntries({ district: 'Chennai' }, 'approved');
    expect(chennaiSignals.length).toBeGreaterThan(0);
    expect(chennaiSignals.every((e) => e.district === 'Chennai')).toBe(true);

    const maduraiSignals = dataStore.getEntries({ district: 'Madurai' }, 'approved');
    expect(maduraiSignals.length).toBeGreaterThan(0);
    expect(maduraiSignals.every((e) => e.district === 'Madurai')).toBe(true);
  });

  it('filters parody signals by category', () => {
    const echoes = dataStore.getEntries({ category: 'cinematic_echo' }, 'approved');
    expect(echoes.length).toBeGreaterThan(0);
    expect(echoes.every((e) => e.category === 'cinematic_echo')).toBe(true);
  });

  it('filters parody signals by search keyword in title, landmark, or description', () => {
    const searchResults = dataStore.getEntries({ search: 'lighthouse' }, 'approved');
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].title.toLowerCase()).toContain('lighthouse');
  });

  it('filters parody signals by bounding box coordinates', () => {
    // Chennai bounding box
    const chennaiBbox = {
      minLat: 12.9,
      maxLat: 13.3,
      minLng: 80.1,
      maxLng: 80.4,
    };

    const bboxSignals = dataStore.getEntries({ bbox: chennaiBbox }, 'approved');
    expect(bboxSignals.length).toBeGreaterThan(0);
    expect(bboxSignals.every((e) => e.district === 'Chennai')).toBe(true);
  });

  it('creates new parody submissions with strictly "pending" status', () => {
    const newSubmission = dataStore.createEntry(
      {
        title: 'Salem Mango Gravitational Oscillation Lore',
        description: 'Humorous viral satire regarding slow motion sunglasses flicking near mango trees.',
        category: 'viral_meme',
        district: 'Salem',
        landmark_name: 'Yercaud Foothills Junction',
        latitude: 11.6643,
        longitude: 78.1460,
        signal_strength: 90,
        frequency_mhz: 104.2,
        is_fictional_confirmed: true,
      },
      'test-user-1',
      'SalemSatirist'
    );

    expect(newSubmission.status).toBe('pending');
    expect(newSubmission.approved_at).toBeUndefined();

    // Pending entries must NOT appear in public approved queries
    const publicEntries = dataStore.getEntries({}, 'approved');
    expect(publicEntries.some((e) => e.id === newSubmission.id)).toBe(false);

    // But MUST appear in admin moderation queue
    const pendingEntries = dataStore.getEntries({}, 'pending');
    expect(pendingEntries.some((e) => e.id === newSubmission.id)).toBe(true);
  });

  it('allows moderator to approve a parody signal and records an audit log', () => {
    const newSubmission = dataStore.createEntry(
      {
        title: 'Trichy Kaveri Acoustic Rebound Beacon',
        description: 'Acoustic sensor registered mass entrance BGM resonance bouncing off Kaveri bridge.',
        category: 'pop_culture_lore',
        district: 'Tiruchirappalli',
        landmark_name: 'Rockfort Periphery',
        latitude: 10.7905,
        longitude: 78.7047,
        signal_strength: 88,
        frequency_mhz: 96.8,
        is_fictional_confirmed: true,
      },
      'test-user-2'
    );

    const approved = dataStore.updateEntryStatus(
      newSubmission.id,
      'approve',
      'Verified 100% fictional parody lore with zero real stalking coordinates.',
      'admin-mod-1'
    );

    expect(approved?.status).toBe('approved');
    expect(approved?.approved_by).toBe('admin-mod-1');

    const auditLogs = dataStore.getModerationActions();
    const action = auditLogs.find((a) => a.entry_id === newSubmission.id || a.event_id === newSubmission.id);
    expect(action).toBeDefined();
    expect(action?.action).toBe('approve');
    expect(action?.reason).toContain('Verified 100% fictional parody lore');
  });

  it('enforces database-backed rate limits for parody transmissions', () => {
    const testKey = 'test-ip-parody-limit';
    const limit = 3;
    const windowMs = 60000;

    expect(dataStore.checkRateLimit(testKey, limit, windowMs).allowed).toBe(true);
    expect(dataStore.checkRateLimit(testKey, limit, windowMs).allowed).toBe(true);
    expect(dataStore.checkRateLimit(testKey, limit, windowMs).allowed).toBe(true);

    // 4th request must be rejected
    const blocked = dataStore.checkRateLimit(testKey, limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
