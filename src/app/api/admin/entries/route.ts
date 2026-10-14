import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const search = searchParams.get('search') || undefined;

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify moderator role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || !['moderator', 'admin'].includes(profile.role)) {
          return NextResponse.json(
            { error: 'Forbidden: Moderator privileges required.' },
            { status: 403 }
          );
        }

        let query = supabase.from('tracker_entries').select('*');
        if (status !== 'all') {
          query = query.eq('status', status);
        }
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,landmark_name.ilike.%${search}%`);
        }

        const { data: entries, error } = await query.order('created_at', { ascending: false });
        const { data: auditLogs } = await supabase
          .from('moderation_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error) {
          return NextResponse.json({
            entries: entries || [],
            events: entries || [],
            auditLogs: auditLogs || [],
            source: 'supabase',
          });
        }
      } catch (dbErr) {
        console.warn('Falling back to local demo admin store:', dbErr);
      }
    }

    // Demo Mode fallback
    const entries = dataStore.getEntries({ search }, status);
    const auditLogs = dataStore.getModerationActions();

    return NextResponse.json({
      entries,
      events: entries,
      auditLogs,
      source: 'demo_store',
      notice: 'Demo Mode: Moderator authorization simulated.',
    });
  } catch (error) {
    console.error('Admin entries fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve moderation queue.' },
      { status: 500 }
    );
  }
}
