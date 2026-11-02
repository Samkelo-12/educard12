import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const BodySchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  secret: z.string().min(1),
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

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { data, error } = await supabaseAdmin
          .from('transport_applications')
          .update({ status: parsed.status, reviewed_at: new Date().toISOString() })
          .eq('id', parsed.applicationId)
          .select('id, user_id, status, valid_until')
          .maybeSingle();

        if (error) {
          return json({ success: false, error: error.message }, 500);
        }
        if (!data) {
          return json({ success: false, error: 'Application not found' }, 404);
        }

        // Best-effort push to the student's registered devices.
        try {
          const { sendPushToUser } = await import('@/lib/push.server');
          const title = parsed.status === 'approved' ? 'Application approved' : 'Application rejected';
          const body =
            parsed.status === 'approved'
              ? `Great news! Your transport application has been approved${
                  data.valid_until ? ` and is valid until ${data.valid_until.slice(0, 10)}` : ''
                }.`
              : 'Unfortunately your transport application was not approved. You may submit a new application.';
          await sendPushToUser(data.user_id, title, body, '/notifications');
        } catch (pushErr) {
          console.error('Review push failed:', pushErr);
        }

        return json({
          success: true,
          application: {
            id: data.id,
            status: data.status,
            valid_until: data.valid_until,
          },
        });
      },
    },
  },
});
