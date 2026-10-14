import { z } from 'zod';
import { extractSourceUrl, isTrustedSourceUrl } from './trusted-sources';

const FORBIDDEN_PRIVATE_KEYWORDS = [
  'house',
  'residence',
  'residential',
  'apartment',
  'flat no',
  'door no',
  'private villa',
  'home address',
  'hiding',
  'hotel room',
  'spotted walking',
  'saw him eating',
  'personal car',
  'secret location',
  'chasing',
  'stalking',
  'following him',
  'whereabouts now',
  'current location',
  'live location',
  'real sighting',
  'actual address',
  'found him',
];

export const SignalCategoryEnum = z.enum([
  'cinematic_echo',
  'tea_shop_myth',
  'folklore_rumor',
  'viral_meme',
  'pop_culture_lore',
  'parody_frequency',
]);

// Backward-compatible alias
export const EventCategoryEnum = SignalCategoryEnum;

export const trackerSubmissionSchema = z.object({
  title: z
    .string()
    .min(5, 'Signal title must be at least 5 characters')
    .max(120, 'Signal title cannot exceed 120 characters')
    .refine((val) => !containsForbiddenKeywords(val), {
      message: 'Submissions must only be fictional parody lore. Personal sightings or private tracking keywords are strictly forbidden.',
    }),
  category: SignalCategoryEnum,
  district: z.string().min(2, 'District is required').max(60, 'District name is too long'),
  landmark_name: z
    .string()
    .min(3, 'Landmark or public sector name must be at least 3 characters')
    .max(120, 'Landmark name is too long')
    .refine((val) => !containsForbiddenKeywords(val), {
      message: 'Landmark must be a recognizable public area or cultural spot. Private residences are strictly rejected.',
    }),
  latitude: z
    .number()
    .min(8.0, 'Latitude must be within Tamil Nadu / South India bounds (min 8.0)')
    .max(14.5, 'Latitude must be within Tamil Nadu / South India bounds (max 14.5)'),
  longitude: z
    .number()
    .min(76.0, 'Longitude must be within Tamil Nadu / South India bounds (min 76.0)')
    .max(81.0, 'Longitude must be within Tamil Nadu / South India bounds (max 81.0)'),
  description: z
    .string()
    .min(15, 'Please provide creative parody lore or description (at least 15 characters)')
    .max(1500, 'Description cannot exceed 1500 characters')
    .refine((val) => !containsForbiddenKeywords(val), {
      message: 'Description contains disallowed keywords relating to personal surveillance, private life, or non-parody sightings.',
    }),
  signal_strength: z.number().min(10).max(100).default(85),
  frequency_mhz: z.number().min(80).max(110).default(104.2),
  is_fictional_confirmed: z.literal(true, {
    error: 'You must certify that this entry is 100% fictional parody lore.',
  }),
  media_path: z.string().max(1000).optional().or(z.literal('')),
  show_public_attribution: z.boolean().default(false),
  author_display_name: z.string().max(50).optional().or(z.literal('')),
});

export type TrackerSubmissionFormValues = z.infer<typeof trackerSubmissionSchema>;

// Simplified mobile-first parody reporting schema
export const simpleReportSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'Please enter a note (at least 3 characters)')
    .max(500, 'Note cannot exceed 500 characters')
    .refine((val) => !containsForbiddenKeywords(val), {
      message: 'Submissions must only be fictional parody lore. Personal sightings, real coordinates, or private keywords are strictly forbidden.',
    }),
  latitude: z
    .number()
    .min(8.0, 'Submitted coordinates are outside the supported Tamil Nadu coverage area (min 8.0° N). Preset substitutions are not permitted.')
    .max(14.5, 'Submitted coordinates are outside the supported Tamil Nadu coverage area (max 14.5° N). Preset substitutions are not permitted.')
    .optional(),
  longitude: z
    .number()
    .min(76.0, 'Submitted coordinates are outside the supported Tamil Nadu coverage area (min 76.0° E). Preset substitutions are not permitted.')
    .max(81.0, 'Submitted coordinates are outside the supported Tamil Nadu coverage area (max 81.0° E). Preset substitutions are not permitted.')
    .optional(),
  media_path: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_fictional_confirmed: z.literal(true, {
    error: 'You must certify that this entry is 100% fictional parody lore.',
  }).default(true),
  district: z.string().optional(),
  landmark_name: z.string().optional(),
  location_name: z.string().optional(),
  area_label: z.string().optional(),
  show_public_attribution: z.boolean().default(false).optional(),
  author_display_name: z.string().max(50).optional().or(z.literal('')),
});

export type SimpleReportFormValues = z.infer<typeof simpleReportSchema>;

// Trusted Public Appearance announcement schema
export const publicAppearanceSubmissionSchema = z.object({
  report_text: z
    .string()
    .trim()
    .min(10, 'Please provide the city/venue, short note, and announcement link (min 10 characters).')
    .max(500, 'Report text cannot exceed 500 characters.')
    .refine((val) => !containsForbiddenKeywords(val), {
      message: 'Submissions must only be intentionally announced public appearances. Private whereabouts, hotel rooms, residences, and unverified tracking are strictly forbidden.',
    })
    .refine((val) => extractSourceUrl(val) !== null, {
      message: 'A link to an intentionally announced public appearance is required for publication.',
    })
    .refine((val) => {
      const url = extractSourceUrl(val);
      return url ? isTrustedSourceUrl(url) : false;
    }, {
      message: 'The announcement link must be from a trusted news publication, official portal, or verified event platform.',
    }),
  latitude: z.number().min(8.0).max(14.5).optional(),
  longitude: z.number().min(76.0).max(81.0).optional(),
  media_path: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  show_public_attribution: z.boolean().default(false).optional(),
  author_display_name: z.string().max(50).optional().or(z.literal('')),
});

export type PublicAppearanceFormValues = z.infer<typeof publicAppearanceSubmissionSchema>;

// Geographical bounds for Tamil Nadu / South India coverage
export const TAMIL_NADU_BOUNDS = {
  minLat: 8.0,
  maxLat: 14.5,
  minLng: 76.0,
  maxLng: 81.0,
} as const;

export function isWithinCoverageBounds(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= TAMIL_NADU_BOUNDS.minLat &&
    lat <= TAMIL_NADU_BOUNDS.maxLat &&
    lng >= TAMIL_NADU_BOUNDS.minLng &&
    lng <= TAMIL_NADU_BOUNDS.maxLng
  );
}

export function getNeutralAreaLabel(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
  return `Approx. Sector (${latStr}, ${lngStr})`;
}

export function getHumanReadableAreaLabel(lat: number, lng: number): string {
  if (!isWithinCoverageBounds(lat, lng)) {
    return 'Outside Coverage Area';
  }

  const districts = [
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
    { name: 'Salem', lat: 11.6643, lng: 78.1460 },
    { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
    { name: 'Thanjavur', lat: 10.7870, lng: 79.1378 },
    { name: 'Erode', lat: 11.3410, lng: 77.7172 },
    { name: 'Vellore', lat: 12.9165, lng: 79.1325 },
    { name: 'Dindigul', lat: 10.3673, lng: 77.9803 },
    { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036 },
    { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
    { name: 'Cuddalore', lat: 11.7480, lng: 79.7714 },
  ];

  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const d of districts) {
    const dist = Math.hypot(d.lat - lat, d.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = d.name;
    }
  }

  // If very close to a known city center (< 0.20 degrees ≈ 22km), describe with city context
  if (closestCity && minDistance <= 0.20) {
    return `${closestCity} Area (${getNeutralAreaLabel(lat, lng)})`;
  }

  return getNeutralAreaLabel(lat, lng);
}

export function getDistrictFromCoords(lat: number, lng: number): string {
  if (!isWithinCoverageBounds(lat, lng)) {
    return 'Outside Coverage Area';
  }

  const districts = [
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
    { name: 'Salem', lat: 11.6643, lng: 78.1460 },
    { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
    { name: 'Thanjavur', lat: 10.7870, lng: 79.1378 },
    { name: 'Erode', lat: 11.3410, lng: 77.7172 },
    { name: 'Vellore', lat: 12.9165, lng: 79.1325 },
    { name: 'Dindigul', lat: 10.3673, lng: 77.9803 },
    { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036 },
    { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
    { name: 'Cuddalore', lat: 11.7480, lng: 79.7714 },
  ];

  let closest = 'Central Tamil Nadu';
  let minDistance = Infinity;

  for (const d of districts) {
    const dist = Math.hypot(d.lat - lat, d.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d.name;
    }
  }

  return closest;
}

// Backward-compatible alias
export const eventSubmissionSchema = trackerSubmissionSchema;
export type EventSubmissionFormValues = TrackerSubmissionFormValues;

export const moderationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'remove']),
  reason: z.string().min(3, 'A reason is required for administrative moderation actions').max(300),
});

export type ModerationActionValues = z.infer<typeof moderationActionSchema>;

export function containsForbiddenKeywords(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FORBIDDEN_PRIVATE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}
