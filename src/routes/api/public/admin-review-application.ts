import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const BodySchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  secret: z.string().min(1),
  rejectionReason: z.string().max(500).nullable().optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const Route = createFileRoute('/api/public/admin-review-application')({
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

        const cleanedReason =
          parsed.status === 'rejected'
            ? (parsed.rejectionReason ?? '').trim() || null
            : null;

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { data, error } = await supabaseAdmin
          .from('transport_applications')
          .update({
            status: parsed.status,
            reviewed_at: new Date().toISOString(),
            rejection_reason: cleanedReason,
          } as never)
          .eq('id', parsed.applicationId)
          .select('id, user_id, status, valid_until, rejection_reason')
          .maybeSingle();

        if (error) {
          return json({ success: false, error: error.message }, 500);
        }
        if (!data) {
          return json({ success: false, error: 'Application not found' }, 404);
        }

      const row = data as unknown as {
  id: string;
  user_id: string;
  status: string;
  valid_until: string | null;
  rejection_reason?: string | null;
};

        // Best-effort push to the student's registered devices.
        try {
          const { sendPushToUser } = await import('@/lib/push.server');
          const title = parsed.status === 'approved' ? 'Application approved' : 'Application rejected';
          const body =
            parsed.status === 'approved'
              ? `Great news! Your transport application has been approved${
                  row.valid_until ? ` and is valid until ${row.valid_until.slice(0, 10)}` : ''
                }.`
              : row.rejection_reason
                ? `Your transport application was not approved: ${row.rejection_reason}`
                : 'Unfortunately your transport application was not approved. You may submit a new application.';
          await sendPushToUser(row.user_id, title, body, '/notifications');
        } catch (pushErr) {
          console.error('Review push failed:', pushErr);
        }

        return json({
          success: true,
          application: {
            id: row.id,
            status: row.status,
            valid_until: row.valid_until,
            rejection_reason: row.rejection_reason,
          },
        });
      },
    },
  },
});
