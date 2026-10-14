import { z } from 'zod';

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
