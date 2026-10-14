import { describe, it, expect } from 'vitest';
import {
  trackerSubmissionSchema,
  simpleReportSchema,
  publicAppearanceSubmissionSchema,
  getDistrictFromCoords,
  isWithinCoverageBounds,
  getNeutralAreaLabel,
  getHumanReadableAreaLabel,
  moderationActionSchema,
  containsForbiddenKeywords,
  sanitizeText,
} from '@/lib/validation';
import {
  extractSourceUrl,
  isTrustedSourceUrl,
  extractCityAndVenue,
} from '@/lib/trusted-sources';

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

    it('rejects a note longer than 500 characters', () => {
      const longNote = {
        note: 'A'.repeat(501),
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

    it('correctly maps coordinates to nearest Tamil Nadu district within coverage', () => {
      // Chennai coordinates
      expect(getDistrictFromCoords(13.0827, 80.2707)).toBe('Chennai');

      // Madurai coordinates
      expect(getDistrictFromCoords(9.9252, 78.1198)).toBe('Madurai');

      // Coimbatore coordinates
      expect(getDistrictFromCoords(11.0168, 76.9558)).toBe('Coimbatore');

      // Tiruchirappalli coordinates
      expect(getDistrictFromCoords(10.7905, 78.7047)).toBe('Tiruchirappalli');
    });

    it('rejects coordinates outside Tamil Nadu coverage in getDistrictFromCoords without silent Chennai default', () => {
      // London coordinates
      expect(getDistrictFromCoords(51.5074, -0.1278)).toBe('Outside Coverage Area');
      // New Delhi coordinates
      expect(getDistrictFromCoords(28.6139, 77.2090)).toBe('Outside Coverage Area');
      // Tokyo coordinates
      expect(getDistrictFromCoords(35.6762, 139.6503)).toBe('Outside Coverage Area');
    });

    it('validates coverage bounds using isWithinCoverageBounds', () => {
      expect(isWithinCoverageBounds(13.0827, 80.2707)).toBe(true); // Chennai
      expect(isWithinCoverageBounds(8.0883, 77.5385)).toBe(true);  // Kanyakumari
      expect(isWithinCoverageBounds(11.0168, 76.9558)).toBe(true); // Coimbatore
      expect(isWithinCoverageBounds(51.5074, -0.1278)).toBe(false); // London
      expect(isWithinCoverageBounds(28.6139, 77.2090)).toBe(false); // New Delhi
      expect(isWithinCoverageBounds(NaN, NaN)).toBe(false);
    });

    it('generates a neutral approximate sector label preserving coordinates', () => {
      const neutral = getNeutralAreaLabel(10.7905, 78.7047);
      expect(neutral).toBe('Approx. Sector (10.79°N, 78.70°E)');

      const neutralSouth = getNeutralAreaLabel(-10.50, -75.20);
      expect(neutralSouth).toBe('Approx. Sector (10.50°S, 75.20°W)');
    });

    it('generates human-readable area labels without forcing unverified city names', () => {
      // Near known city center (Chennai)
      expect(getHumanReadableAreaLabel(13.0827, 80.2707)).toContain('Chennai Area');
      // In Tamil Nadu bounds away from major city centers
      const rural = getHumanReadableAreaLabel(9.50, 77.30);
      expect(rural).toContain('Approx. Sector (9.50°N, 77.30°E)');
      // Outside coverage
      expect(getHumanReadableAreaLabel(51.5074, -0.1278)).toBe('Outside Coverage Area');
    });
  });

  describe('Trusted Public Appearance Reporting & Publication Rules', () => {
    it('accepts an announcement with a trusted source link and public venue', () => {
      const valid = {
        report_text: 'Chennai YMCA Grounds - Book Fair keynote speech https://thehindu.com/entertainment/art/chennai-book-fair',
        show_public_attribution: true,
        author_display_name: 'PressVolunteer',
      };

      const result = publicAppearanceSubmissionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an announcement without any source link', () => {
      const missingLink = {
        report_text: 'Spotted at Chennai YMCA Grounds yesterday afternoon giving a speech.',
      };

      const result = publicAppearanceSubmissionSchema.safeParse(missingLink);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('link to an intentionally announced public appearance is required');
      }
    });

    it('rejects an announcement with an untrusted or suspicious link', () => {
      const untrustedLink = {
        report_text: 'Chennai Hall meeting announced at https://suspicious-tracker-blog.xyz/post/123',
      };

      const result = publicAppearanceSubmissionSchema.safeParse(untrustedLink);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('trusted news publication');
      }
    });

    it('rejects announcements containing private residence or stalking keywords', () => {
      const stalkingAttempt = {
        report_text: 'Saw him at his private residence apartment address https://thehindu.com/news',
      };

      const result = publicAppearanceSubmissionSchema.safeParse(stalkingAttempt);
      expect(result.success).toBe(false);
    });

    it('extracts source URL accurately from text', () => {
      const text = 'Event announced in Madurai https://timesofindia.indiatimes.com/city/madurai - join us';
      expect(extractSourceUrl(text)).toBe('https://timesofindia.indiatimes.com/city/madurai');
    });

    it('validates allowlisted domains and rejects unknown domains', () => {
      expect(isTrustedSourceUrl('https://thehindu.com/news')).toBe(true);
      expect(isTrustedSourceUrl('https://timesofindia.indiatimes.com/event')).toBe(true);
      expect(isTrustedSourceUrl('https://dinamalar.com/event')).toBe(true);
      expect(isTrustedSourceUrl('https://bookmyshow.com/chennai')).toBe(true);
      expect(isTrustedSourceUrl('https://cinemaexpress.com/tamil')).toBe(true);
      expect(isTrustedSourceUrl('https://untrusted-fake-news-tracker.net/leak')).toBe(false);
    });

    it('derives city and public venue from announcement text', () => {
      const text = 'Coimbatore CODISSIA Trade Fair Complex cultural seminar https://thehindu.com';
      const extraction = extractCityAndVenue(text);
      expect(extraction.city).toBe('Coimbatore');
      expect(extraction.coords?.lat).toBeCloseTo(11.0168, 1);
      expect(extraction.venue.toLowerCase()).toContain('codissia');
      expect(extraction.hasMatchedCity).toBe(true);
    });

    it('does NOT silently default to Chennai when no city is mentioned in announcement text', () => {
      const text = 'Keynote speech at an auditorium https://thehindu.com/news';
      const extraction = extractCityAndVenue(text);
      expect(extraction.city).toBeNull();
      expect(extraction.coords).toBeNull();
      expect(extraction.hasMatchedCity).toBe(false);
      expect(extraction.venue.toLowerCase()).toContain('auditorium');
    });
  });

  describe('Optional Photo & Location Reporting Submissions', () => {
    it('accepts a Note-only submission without photo or location', () => {
      const noteOnly = {
        note: 'Mysterious tea stall radio frequency oscillation heard in Trichy',
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(noteOnly);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.note).toBe('Mysterious tea stall radio frequency oscillation heard in Trichy');
        expect(result.data.latitude).toBeUndefined();
        expect(result.data.longitude).toBeUndefined();
        expect(result.data.media_path).toBeUndefined();
      }
    });

    it('accepts a submission with an optional photo (media_path / image_url)', () => {
      const withPhoto = {
        note: 'Fictional parody poster seen near Central Station',
        media_path: 'signals/signal-1710000000-abc123.jpg',
        image_url: 'https://example.com/signals/signal-1710000000-abc123.jpg',
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(withPhoto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.media_path).toBe('signals/signal-1710000000-abc123.jpg');
        expect(result.data.image_url).toBe('https://example.com/signals/signal-1710000000-abc123.jpg');
      }
    });

    it('accepts a submission with an optional browser location', () => {
      const withLocation = {
        note: 'Parody cinema dialogue echo reverberating near Madurai',
        latitude: 9.9252,
        longitude: 78.1198,
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(withLocation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(9.9252);
        expect(result.data.longitude).toBe(78.1198);
        expect(result.data.media_path).toBeUndefined();
      }
    });

    it('accepts a submission with BOTH optional photo and location', () => {
      const withBoth = {
        note: 'Promotional cinema cutout resonance in Coimbatore',
        latitude: 11.0168,
        longitude: 76.9558,
        media_path: 'signals/coimbatore-poster.png',
        image_url: 'https://example.com/signals/coimbatore-poster.png',
        is_fictional_confirmed: true,
      };

      const result = simpleReportSchema.safeParse(withBoth);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(11.0168);
        expect(result.data.longitude).toBe(76.9558);
        expect(result.data.media_path).toBe('signals/coimbatore-poster.png');
      }
    });
  });
});

