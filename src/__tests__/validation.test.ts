import { describe, it, expect } from 'vitest';
import {
  trackerSubmissionSchema,
  simpleReportSchema,
  getDistrictFromCoords,
  moderationActionSchema,
  containsForbiddenKeywords,
  sanitizeText,
} from '@/lib/validation';

describe('Parody Tracker Validation & Security Logic', () => {
  it('accepts a valid parody signal submission', () => {
    const validData = {
      title: 'Madurai Malli Poo High-Frequency Mystery Ping',
      category: 'folklore_rumor',
      district: 'Madurai',
      landmark_name: 'Vandiyur Mariamman Teppakulam',
      latitude: 9.9142,
      longitude: 78.1472,
      signal_strength: 88,
      frequency_mhz: 104.2,
      description: 'Parody radar tripped by intense jasmine fragrance oscillation near night market.',
      is_fictional_confirmed: true,
      show_public_attribution: true,
      author_display_name: 'MaduraiVeeranEcho',
    };

    const result = trackerSubmissionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects submissions without mandatory fictional certification', () => {
    const uncertifiedData = {
      title: 'Marina Beach Parody Resonance',
      category: 'cinematic_echo',
      district: 'Chennai',
      landmark_name: 'Marina Beach Promenade',
      latitude: 13.0499,
      longitude: 80.2824,
      signal_strength: 90,
      frequency_mhz: 98.4,
      description: 'Creative cinema echo recorded near the lighthouse.',
      is_fictional_confirmed: false, // Must be true!
    };

    const result = trackerSubmissionSchema.safeParse(uncertifiedData);
    expect(result.success).toBe(false);
  });

  it('rejects submissions with missing or short titles', () => {
    const invalidData = {
      title: 'Ping', // Short (< 5 chars)
      category: 'tea_shop_myth',
      district: 'Chennai',
      landmark_name: 'Tea Corner',
      latitude: 13.0827,
      longitude: 80.2707,
      description: 'Valid long enough creative description of tea stall lore.',
      is_fictional_confirmed: true,
    };

    const result = trackerSubmissionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('strictly rejects private residence or stalking keywords in landmark or title', () => {
    expect(containsForbiddenKeywords('Spotted at his private residence')).toBe(true);
    expect(containsForbiddenKeywords('Saw him walking outside his flat no 402')).toBe(true);
    expect(containsForbiddenKeywords('Stalking him at the restaurant')).toBe(true);
    expect(containsForbiddenKeywords('hiding in hotel room')).toBe(true);
    expect(containsForbiddenKeywords('Marina Beach Promenade')).toBe(false);

    const stalkingAttempt = {
      title: 'Spotted walking near home address',
      category: 'tea_shop_myth',
      district: 'Chennai',
      landmark_name: 'Private villa garden',
      latitude: 13.0827,
      longitude: 80.2707,
      description: 'Personal sighting of him eating at secret location.',
      is_fictional_confirmed: true,
    };

    const result = trackerSubmissionSchema.safeParse(stalkingAttempt);
    expect(result.success).toBe(false);
  });

  it('rejects coordinates outside Tamil Nadu / South India bounds', () => {
    const outOfBoundsData = {
      title: 'Delhi Parody Signal Attempt',
      category: 'pop_culture_lore',
      district: 'New Delhi',
      landmark_name: 'Pragati Maidan Sector',
      latitude: 28.6139, // Latitude > 14.5
      longitude: 77.2090,
      description: 'Attempting to submit signal far outside Tamil Nadu boundaries.',
      is_fictional_confirmed: true,
    };

    const result = trackerSubmissionSchema.safeParse(outOfBoundsData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.latitude).toBeDefined();
    }
  });

  it('enforces mandatory moderator reason on moderation actions', () => {
    const invalidAction = {
      action: 'reject',
      reason: '', // Empty reason
    };

    const result = moderationActionSchema.safeParse(invalidAction);
    expect(result.success).toBe(false);

    const validAction = {
      action: 'approve',
      reason: 'Confirmed 100% fictional parody lore with zero personal coordinates.',
    };
    expect(moderationActionSchema.safeParse(validAction).success).toBe(true);
  });

  it('sanitizes user input to prevent HTML and script injection', () => {
    const dirty = '<script>alert("xss")</script><b>Parody Lore</b>';
    const clean = sanitizeText(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('&lt;script&gt;');
  });

  describe('Simplified Reporting Flow (simpleReportSchema & getDistrictFromCoords)', () => {
    it('accepts a valid simplified report with note and coordinates', () => {
      const validReport = {
        note: 'Tea glass clinking rhythm detected near Marina',
        latitude: 13.0827,
        longitude: 80.2707,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.note).toBe('Tea glass clinking rhythm detected near Marina');
        expect(result.data.latitude).toBe(13.0827);
        expect(result.data.longitude).toBe(80.2707);
      }
    });

    it('rejects an empty note', () => {
      const emptyNote = {
        note: '   ',
        latitude: 13.0827,
        longitude: 80.2707,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(emptyNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.note).toBeDefined();
      }
    });

    it('rejects a note shorter than 3 characters', () => {
      const shortNote = {
        note: 'Hi',
        latitude: 13.0827,
        longitude: 80.2707,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(shortNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.note).toBeDefined();
      }
    });

    it('rejects a note longer than 280 characters', () => {
      const longNote = {
        note: 'A'.repeat(281),
        latitude: 13.0827,
        longitude: 80.2707,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(longNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.note).toBeDefined();
      }
    });

    it('strictly rejects forbidden stalking keywords in the simplified note', () => {
      const forbiddenReport = {
        note: 'Spotted entering his private residence apartment',
        latitude: 13.0827,
        longitude: 80.2707,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(forbiddenReport);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.note).toBeDefined();
      }
    });

    it('rejects coordinates outside Tamil Nadu / South India bounds', () => {
      const outOfBounds = {
        note: 'Parody signal ping from New Delhi',
        latitude: 28.6139,
        longitude: 77.2090,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(outOfBounds);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.latitude).toBeDefined();
      }
    });

    it('correctly maps coordinates to nearest Tamil Nadu district', () => {
      // Chennai coordinates
      expect(getDistrictFromCoords(13.0827, 80.2707)).toBe('Chennai');

      // Madurai coordinates
      expect(getDistrictFromCoords(9.9252, 78.1198)).toBe('Madurai');

      // Coimbatore coordinates
      expect(getDistrictFromCoords(11.0168, 76.9558)).toBe('Coimbatore');

      // Tiruchirappalli coordinates
      expect(getDistrictFromCoords(10.7905, 78.7047)).toBe('Tiruchirappalli');
    });
  });
});

