import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const BodySchema = z.object({
  secret: z.string().min(1),
});

const BUCKET = 'transport-documents';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toSignedUrl(supabaseAdmin: any, rawValue: unknown): Promise<string | null> {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const normalizedPath = trimmed.replace(/^transport-documents\//, '');
  const { data } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(normalizedPath, 60 * 15);
  return data?.signedUrl ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveDocuments(supabaseAdmin: any, row: Record<string, unknown>) {
  const docs: Array<{ label: string; url: string }> = [];

  const entries: Array<[unknown, string]> = [
    [row.id_document_url, 'Certified ID Copy'],
    [row.proof_of_registration_url, 'Proof of Registration'],
    [row.bursary_proof_url, 'Proof of Bursary Acceptance'],
    [row.residence_proof_url, 'Proof of Residence Acceptance'],
    [row.nsfas_proof_url, 'Proof of NSFAS Funding'],
    [row.payment_proof_url, 'Proof of Payment'],
  ];

  for (const [rawVal, label] of entries) {
    const signedUrl = await toSignedUrl(supabaseAdmin, rawVal);
    if (signedUrl) {
      docs.push({ label, url: signedUrl });
    }
  }

  return docs;
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
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) {
          return json({ success: false, error: error.message }, 500);
        }

        const rows = (data ?? []) as Array<
          Record<string, unknown> & {
            id: string;
            user_id: string;
            created_at: string;
            valid_until: string | null;
          }
        >;

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

        const applications = await Promise.all(
          rows.map(async (row) => {
            const profile = profileMap.get(row.user_id) ?? null;
            const documents = await resolveDocuments(supabaseAdmin, row);
            const fallbackName = [row.first_names, row.surname].filter(Boolean).join(' ').trim();
            return {
              ...row,
              id: row.id,
              created_at: row.created_at,
              student_name: profile?.full_name || fallbackName || 'Unknown student',
              student_number: profile?.student_number || String(row.student_number ?? ''),
              documents,
            };
          }),
        );

        return json({ success: true, applications });
      },
    },
  },
});