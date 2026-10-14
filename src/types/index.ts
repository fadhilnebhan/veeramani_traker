export type SignalCategory =
  | 'cinematic_echo'
  | 'tea_shop_myth'
  | 'folklore_rumor'
  | 'viral_meme'
  | 'pop_culture_lore'
  | 'parody_frequency';

export type SignalStatus = 'pending' | 'approved' | 'rejected' | 'removed';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  display_name: string | null;
  show_public_attribution: boolean;
  role: UserRole;
  account_status: string;
  created_at: string;
  updated_at: string;
}

export interface TrackerEntry {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: SignalCategory;
  district: string;
  landmark_name: string;
  latitude: number;
  longitude: number;
  signal_strength: number; // Percentage 10-100
  frequency_mhz: number;   // e.g. 104.2
  is_fictional_confirmed: boolean;
  status: SignalStatus;
  media_path?: string | null;
  author_id?: string | null;
  author_display_name?: string | null;
  moderation_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  // Compatibility fields for legacy consumers
  city?: string;
  venue_name?: string;
}

// Backward-compatible alias for existing components
export type EventItem = TrackerEntry;
export type EventCategory = SignalCategory;
export type EventStatus = SignalStatus;

export interface ModerationAction {
  id: string;
  entry_id: string;
  event_id?: string;
  moderator_id: string;
  action: string;
  reason?: string | null;
  created_at: string;
  entry_title?: string;
  moderator_name?: string;
}

export interface TrackerFilters {
  search?: string;
  district?: string;
  category?: SignalCategory | 'all';
  signalStrength?: 'all' | 'high' | 'medium';
  bbox?: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
}

// Backward-compatible alias for EventFilters
export type EventFilters = TrackerFilters & {
  city?: string;
  timeFilter?: string;
};

export const SIGNAL_CATEGORIES: Record<
  SignalCategory,
  { label: string; tamil: string; color: string; desc: string }
> = {
  cinematic_echo: {
    label: 'Cinematic Echo',
    tamil: 'திரைப்பட எதிரொலி',
    color: '#F5C542',
    desc: 'Simulated high-frequency dialogue resonance and cinema lore echo.',
  },
  tea_shop_myth: {
    label: 'Tea Shop Myth',
    tamil: 'டீ கடை புரளி',
    color: '#F16F59',
    desc: 'Neighbourhood tea stall hearsay, viral murmurs, and humorous chatter.',
  },
  folklore_rumor: {
    label: 'Folklore Rumor',
    tamil: 'நாட்டுப்புற வதந்தி',
    color: '#7D263D',
    desc: 'Local mythical tale, festival stage folklore, and street legend.',
  },
  viral_meme: {
    label: 'Viral Meme Frequency',
    tamil: 'வைரல் மீம் அலைவரிசை',
    color: '#F5C542',
    desc: 'Internet culture oscillation, social meme resonance, and viral humor.',
  },
  pop_culture_lore: {
    label: 'Pop Culture Lore',
    tamil: 'பாப் கலாச்சார சுவடு',
    color: '#438567',
    desc: 'Nostalgic pop-culture tribute, mass entrance BGM resonance.',
  },
  parody_frequency: {
    label: 'Parody Frequency',
    tamil: 'நகைச்சுவை சிக்னல்',
    color: '#A5A2AD',
    desc: 'Playful fictional radar ping generated for community entertainment.',
  },
};

// Backward-compatible alias for CATEGORY_LABELS
export const CATEGORY_LABELS = SIGNAL_CATEGORIES;

export const TAMIL_NADU_DISTRICTS = [
  'All Districts',
  'Chennai',
  'Madurai',
  'Coimbatore',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Thanjavur',
  'Erode',
  'Vellore',
  'Dindigul',
  'Kanchipuram',
  'Kanyakumari',
  'Cuddalore',
] as const;

// Backward-compatible alias for TAMIL_NADU_CITIES
export const TAMIL_NADU_CITIES = TAMIL_NADU_DISTRICTS;
