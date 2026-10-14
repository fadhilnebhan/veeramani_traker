import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('tracker_entries')
          .select('*, profiles:author_id(display_name, show_public_attribution)')
          .eq('id', id)
          .single();

        if (!error && data) {
          const { data: related } = await supabase
            .from('tracker_entries')
            .select('id, title, district, category, landmark_name, signal_strength, frequency_mhz')
            .eq('status', 'approved')
            .neq('id', id)
            .or(`district.eq.${data.district},category.eq.${data.category}`)
            .limit(3);

          const formatted = {
            ...data,
            author_display_name:
              data.profiles?.show_public_attribution ? data.profiles.display_name : null,
          };

          return NextResponse.json({
            entry: formatted,
            signal: formatted,
            event: formatted,
            related: related || [],
          });
        }
      } catch (dbErr) {
        console.warn('Falling back to local data store:', dbErr);
      }
    }

    const entry = dataStore.getEntryById(id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Parody radar signal not found or has dissipated.' },
        { status: 404 }
      );
    }

    const related = dataStore
      .getEntries({ district: entry.district }, 'approved')
      .filter((e) => e.id !== entry.id)
      .slice(0, 3);

    return NextResponse.json({
      entry,
      signal: entry,
      event: entry,
      related,
    });
  } catch (error) {
    console.error('Error fetching tracker signal detail:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve parody radar signal details.' },
      { status: 500 }
    );
  }
}
