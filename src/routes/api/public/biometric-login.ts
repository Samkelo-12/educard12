import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  token: z.string().min(32).max(128),
  credentialId: z.string().min(1).max(512).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Public biometric sign-in endpoint. The caller presents a device pass issued
 * when biometric sign-in was enrolled (verified locally by the device's
 * fingerprint / Face ID authenticator before this call is made). The endpoint
 * matches the pass against its stored SHA-256 hash and mints a fresh session
 * for the owning student via a single-use magic-link token.
 */
export const Route = createFileRoute("/api/public/biometric-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return json({ success: false, error: "Invalid request" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const tokenHash = await sha256Hex(parsed.token);
        let query = supabaseAdmin
          .from("biometric_credentials")
          .select("id, user_id, credential_id")
          .eq("token_hash", tokenHash);
        if (parsed.credentialId) query = query.eq("credential_id", parsed.credentialId);

        const { data: rows, error } = await query.maybeSingle();
        if (error) {
          return json({ success: false, error: "Sign-in failed. Please try again." }, 500);
        }
        if (!rows) {
          return json(
            {
              success: false,
              error:
                "Biometric sign-in is no longer set up on this device. Please sign in with your password and re-enable it.",
            },
            401,
          );
        }

        const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(
          rows.user_id,
        );
        const email = user?.user?.email;
        if (userError || !email) {
          return json({ success: false, error: "Biometric sign-in failed. Please try again." }, 500);
        }

        const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });
        const tokenHashFromLink = link?.properties?.hashed_token;
        if (linkError || !tokenHashFromLink) {
          return json({ success: false, error: "Biometric sign-in failed. Please try again." }, 500);
        }

        await supabaseAdmin
          .from("biometric_credentials")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", rows.id);

        return json({ success: true, email, tokenHash: tokenHashFromLink });
      },
    },
  },
});
