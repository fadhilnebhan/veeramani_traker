export const DEFAULT_TRUSTED_SOURCE_ALLOWLIST: string[] = [
  // Major trusted news & cultural press
  'thehindu.com',
  'timesofindia.indiatimes.com',
  'dinamalar.com',
  'dailythanthi.com',
  'cinemaexpress.com',
  'vikatan.com',
  'dtnext.in',
  'puthiyathalaimurai.com',
  'news18.com',
  'ndtv.com',
  'indianexpress.com',
  'hindutamil.in',
  'thanthitv.com',
  'polimernews.com',
  // Verified event ticketing & public cultural announcements
  'bookmyshow.com',
  'insider.in',
  'eventbrite.com',
  'ticketnew.com',
  // Official announcement channels & verified social media
  'twitter.com',
  'x.com',
  'instagram.com',
  'youtube.com',
  'facebook.com',
  'threads.net',
  // Official organization & press domains
  'veeramani.org',
  'veeramani-official.org',
  'periyar.org',
  'pressclubchennai.com',
];

export function getTrustedSourceAllowlist(): string[] {
  const envAllowlist =
    process.env.TRUSTED_SOURCE_ALLOWLIST ||
    process.env.NEXT_PUBLIC_TRUSTED_SOURCE_ALLOWLIST;

  if (envAllowlist) {
    const parsed = envAllowlist
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }

  return DEFAULT_TRUSTED_SOURCE_ALLOWLIST;
}

export function extractSourceUrl(text: string): string | null {
  if (!text) return null;
  // Match URLs starting with http:// or https://
  const match = text.match(/https?:\/\/[^\s<>"'{}|\\^`[\]]+/i);
  return match ? match[0] : null;
}

export function isTrustedSourceUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    const allowlist = getTrustedSourceAllowlist();
    return allowlist.some((trustedDomain) => {
      const cleanDomain = trustedDomain.toLowerCase().replace(/^www\./, '');
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    });
  } catch {
    return false;
  }
}

export interface CityVenueExtraction {
  city: string | null;
  venue: string;
  coords: { lat: number; lng: number } | null;
  hasMatchedCity: boolean;
}

export const TN_CITIES_COORDS: Record<string, { lat: number; lng: number }> = {
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
  Puducherry: { lat: 11.9416, lng: 79.8083 },
};

const CITY_ALIASES: Record<string, string> = {
  chennai: 'Chennai',
  madras: 'Chennai',
  madurai: 'Madurai',
  coimbatore: 'Coimbatore',
  kovai: 'Coimbatore',
  tiruchirappalli: 'Tiruchirappalli',
  trichy: 'Tiruchirappalli',
  salem: 'Salem',
  tirunelveli: 'Tirunelveli',
  nellai: 'Tirunelveli',
  thanjavur: 'Thanjavur',
  tanjore: 'Thanjavur',
  erode: 'Erode',
  vellore: 'Vellore',
  dindigul: 'Dindigul',
  kanchipuram: 'Kanchipuram',
  kanyakumari: 'Kanyakumari',
  cuddalore: 'Cuddalore',
  puducherry: 'Puducherry',
  pondicherry: 'Puducherry',
};

export function extractCityAndVenue(text: string): CityVenueExtraction {
  const lower = text.toLowerCase();

  // 1. Detect city (never silently default to Chennai)
  let matchedCity: string | null = null;
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    // Word boundary search
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(lower)) {
      matchedCity = canonical;
      break;
    }
  }

  // 2. Detect public venue keywords
  const venueKeywords = [
    'auditorium',
    'hall',
    'ground',
    'grounds',
    'stadium',
    'complex',
    'university',
    'college',
    'center',
    'centre',
    'thidal',
    'arangam',
    'mandapam',
    'promenade',
    'library',
    'park',
    'memorial',
  ];

  let detectedVenue = matchedCity ? `${matchedCity} Public Venue` : 'Public Venue';

  // Look for sentences or phrases containing a venue keyword
  const words = text.replace(/https?:\/\/[^\s]+/g, '').split(/[,.\n;]+/);
  for (const part of words) {
    const trimmed = part.trim();
    if (venueKeywords.some((kw) => trimmed.toLowerCase().includes(kw))) {
      detectedVenue = trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;
      break;
    }
  }

  const coords = matchedCity ? TN_CITIES_COORDS[matchedCity] || null : null;

  return {
    city: matchedCity,
    venue: detectedVenue,
    coords,
    hasMatchedCity: matchedCity !== null,
  };
}
