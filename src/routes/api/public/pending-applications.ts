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

export const Route = createFileRoute('/api/public/pending-applications')({
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
          .select('id, pickup_point, dropoff_point, period, status, created_at, profiles:user_id ( full_name, student_number )')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) {
          return json({ success: false, error: error.message }, 500);
        }

        const applications = (data ?? []).map((row) => {
          const profile = row.profiles as unknown as { full_name: string; student_number: string } | null;
          return {
            id: row.id,
            pickup_point: row.pickup_point,
            dropoff_point: row.dropoff_point,
            period: row.period,
            created_at: row.created_at,
            student_name: profile?.full_name || 'Unknown student',
            student_number: profile?.student_number || '',
          };
        });

        return json({ success: true, applications });
      },
    },
  },
});
