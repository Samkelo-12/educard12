import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const BodySchema = z.object({
  secret: z.string().min(1),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const Route = createFileRoute('/api/public/application-history')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env['ADMIN_REVIEW_SECRET'];
        if (!expected) {
          return json({ success: false, error: 'Server not configured' }, 500);
        }

        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return json({ success: false, error: 'Invalid request body' }, 400);
        }

        if (parsed.secret !== expected) {
          return json({ success: false, error: 'Unauthorized' }, 401);
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { data, error } = await supabaseAdmin
          .from('transport_applications')
          .select('id, user_id, pickup_point, dropoff_point, period, status, created_at, reviewed_at, valid_until')
          .neq('status', 'pending')
          .order('reviewed_at', { ascending: false });

        if (error) {
          return json({ success: false, error: error.message }, 500);
        }

        const rows = data ?? [];
        const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
        const profileMap = new Map<string, { full_name: string; student_number: string }>();

        if (userIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, student_number')
            .in('id', userIds);
          for (const p of profiles ?? []) {
            profileMap.set(p.id, { full_name: p.full_name, student_number: p.student_number });
          }
        }

        const applications = rows.map((row) => {
          const profile = profileMap.get(row.user_id) ?? null;
          return {
            id: row.id,
            pickup_point: row.pickup_point,
            dropoff_point: row.dropoff_point,
            period: row.period,
            status: row.status,
            created_at: row.created_at,
            reviewed_at: row.reviewed_at,
            valid_until: row.valid_until,
            student_name: profile?.full_name || 'Unknown student',
            student_number: profile?.student_number || '',
          };
        });

        return json({ success: true, applications });
      },
    },
  },
});
