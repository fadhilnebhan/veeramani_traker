import { NextRequest, NextResponse } from 'next/server';
import { trackerSubmissionSchema, simpleReportSchema, getDistrictFromCoords, sanitizeText } from '@/lib/validation';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';
import { SignalCategory, TrackerFilters } from '@/types';

// Rate limit: 5 submissions per 60 minutes
const SUBMISSION_LIMIT = 5;
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const district = searchParams.get('district') || searchParams.get('city') || undefined;
    const category = (searchParams.get('category') as SignalCategory) || undefined;
    const signalStrength = (searchParams.get('signalStrength') as TrackerFilters['signalStrength']) || undefined;

    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');

    const bbox =
      minLat && maxLat && minLng && maxLng
        ? {
            minLat: parseFloat(minLat),
            maxLat: parseFloat(maxLat),
            minLng: parseFloat(minLng),
            maxLng: parseFloat(maxLng),
          }
        : undefined;

    const filters: TrackerFilters = {
      search,
      district,
      category: category && category !== ('all' as any) ? category : undefined,
      signalStrength,
      bbox,
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        let query = supabase
          .from('tracker_entries')
          .select('*, profiles:author_id(display_name, show_public_attribution)')
          .eq('status', 'approved');

        if (district && district !== 'All Districts' && district !== 'All Cities') {
          query = query.eq('district', district);
        }
        if (category && category !== ('all' as any)) {
          query = query.eq('category', category);
        }
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,landmark_name.ilike.%${search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          const formatted = data.map((item: any) => ({
            ...item,
            author_display_name:
              item.profiles?.show_public_attribution ? item.profiles.display_name : null,
          }));

          return NextResponse.json(
            { entries: formatted, signals: formatted, events: formatted, total: formatted.length, source: 'supabase' },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
              },
            }
          );
        }
      } catch (dbErr) {
        console.warn('Falling back to local data store due to Supabase connection error:', dbErr);
      }
    }

    // Default to in-memory dataStore
    const entries = dataStore.getEntries(filters, 'approved');

    return NextResponse.json(
      { entries, signals: entries, events: entries, total: entries.length, source: 'demo_store' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tracker entries:', error);
    return NextResponse.json(
      { error: 'Radar scan failed. Please retry.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `submit:${ip.split(',')[0].trim()}`;
    const rateLimit = dataStore.checkRateLimit(rateLimitKey, SUBMISSION_LIMIT, SUBMISSION_WINDOW_MS);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Radar transmission limit reached. Maximum 5 submissions per hour. Please try again later.',
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate
    const body = await request.json();
    let sanitizedData: any;

    if (body.note !== undefined && !body.title) {
      // Simple Report workflow
      const parseResult = simpleReportSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: parseResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const validSimple = parseResult.data;
      const cleanNote = sanitizeText(validSimple.note);
      const district = validSimple.district || getDistrictFromCoords(validSimple.latitude, validSimple.longitude);

      sanitizedData = {
        title: cleanNote.length > 50 ? cleanNote.substring(0, 47) + '...' : cleanNote,
        description: cleanNote,
        note: cleanNote,
        category: 'parody_frequency',
        district: sanitizeText(district),
        landmark_name: validSimple.landmark_name ? sanitizeText(validSimple.landmark_name) : 'Simulated Signal Sector',
        latitude: validSimple.latitude,
        longitude: validSimple.longitude,
        signal_strength: 88,
        frequency_mhz: 104.2,
        is_fictional_confirmed: true,
        media_path: null,
        author_display_name: 'Radar Scout',
      };
    } else {
      // Full tracker submission workflow
      const parseResult = trackerSubmissionSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: parseResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const validData = parseResult.data;
      sanitizedData = {
        title: sanitizeText(validData.title),
        description: sanitizeText(validData.description),
        note: sanitizeText(validData.description),
        category: validData.category,
        district: sanitizeText(validData.district),
        landmark_name: sanitizeText(validData.landmark_name),
        latitude: validData.latitude,
        longitude: validData.longitude,
        signal_strength: validData.signal_strength || 85,
        frequency_mhz: validData.frequency_mhz || 104.2,
        is_fictional_confirmed: true,
        media_path: validData.media_path ? sanitizeText(validData.media_path) : null,
        author_display_name: validData.show_public_attribution && validData.author_display_name
          ? sanitizeText(validData.author_display_name)
          : null,
      };
    }

    // 4. Persistence
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const slug = sanitizedData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

        const { data, error } = await supabase
          .from('tracker_entries')
          .insert({
            ...sanitizedData,
            slug,
            author_id: user?.id || null,
            status: 'pending',
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json(
            {
              message: 'Parody radar signal submitted successfully! Placed in moderator queue.',
              entry: data,
              signal: data,
            },
            { status: 201 }
          );
        }
      } catch (dbErr) {
        console.warn('Falling back to local demo data store:', dbErr);
      }
    }

    // Local Demo Persistence
    const createdEntry = dataStore.createEntry(
      sanitizedData,
      'demo-user-1',
      sanitizedData.author_display_name || undefined
    );

    return NextResponse.json(
      {
        message: 'Parody radar signal submitted successfully! Review pending.',
        entry: createdEntry,
        signal: createdEntry,
        event: createdEntry,
        notice: 'Submitted in Demo Mode. Visible in Account and Moderation queues.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing parody signal transmission.' },
      { status: 500 }
    );
  }
}
