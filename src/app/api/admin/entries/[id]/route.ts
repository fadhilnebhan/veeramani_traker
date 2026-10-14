import { NextRequest, NextResponse } from 'next/server';
import { moderationActionSchema, sanitizeText } from '@/lib/validation';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const parseResult = moderationActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid moderation action data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, reason } = parseResult.data;
    const cleanReason = sanitizeText(reason);

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

        const statusMap: Record<string, string> = {
          approve: 'approved',
          reject: 'rejected',
          remove: 'removed',
        };

        const updatePayload: Record<string, any> = {
          status: statusMap[action],
          moderation_reason: cleanReason,
          updated_at: new Date().toISOString(),
        };

        if (action === 'approve') {
          updatePayload.approved_by = user.id;
          updatePayload.approved_at = new Date().toISOString();
        }

        const { data: updatedEntry, error: updateError } = await supabase
          .from('tracker_entries')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (!updateError && updatedEntry) {
          // Record audit log
          await supabase.from('moderation_actions').insert({
            entry_id: id,
            moderator_id: user.id,
            action,
            reason: cleanReason,
          });

          return NextResponse.json({
            message: `Tracker signal successfully marked as ${statusMap[action]}.`,
            entry: updatedEntry,
          });
        }
      } catch (dbErr) {
        console.warn('Falling back to local demo admin store:', dbErr);
      }
    }

    // Demo Mode execution
    const updated = dataStore.updateEntryStatus(
      id,
      action,
      cleanReason,
      'demo-mod-1'
    );

    if (!updated) {
      return NextResponse.json({ error: 'Tracker entry not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: `Tracker signal marked as ${updated.status} in Demo Mode.`,
      entry: updated,
    });
  } catch (error) {
    console.error('Moderation action failed:', error);
    return NextResponse.json(
      { error: 'Internal server error while executing moderation action.' },
      { status: 500 }
    );
  }
}
