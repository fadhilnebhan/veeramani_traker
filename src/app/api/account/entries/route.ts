import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized. Please sign in to view your submissions.' },
            { status: 401 }
          );
        }

        const { data, error } = await supabase
          .from('tracker_entries')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return NextResponse.json({ submissions: data, entries: data });
        }
      } catch (dbErr) {
        console.warn('Falling back to local demo account store:', dbErr);
      }
    }

    const submissions = dataStore.getEntriesByUser('demo-user-1');

    return NextResponse.json({
      submissions,
      entries: submissions,
      notice: 'Demo Mode: Showing simulated contributor transmissions.',
    });
  } catch (error) {
    console.error('Error fetching account entries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve your radar transmissions history.' },
      { status: 500 }
    );
  }
}
