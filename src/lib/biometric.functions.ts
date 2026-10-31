import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegisterSchema = z.object({
  credentialId: z.string().min(8).max(512),
  deviceLabel: z.string().max(120).optional(),
});

/**
 * Issues a random 256-bit device pass for biometric sign-in and records the
 * WebAuthn credential it is tied to. Only the SHA-256 hash of the device pass
 * is stored server-side. Requires a signed-in student (auth middleware).
 */
export const registerBiometricCredential = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RegisterSchema.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const token = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("biometric_credentials").insert({
      user_id: context.userId,
      credential_id: data.credentialId,
      token_hash: tokenHash,
      device_label: data.deviceLabel ?? "This device",
    });
    if (error) throw new Error("Could not enable biometric sign-in. Please try again.");

    return { token };
  });

/**
 * Revokes a biometric credential (and its device pass) for the signed-in
 * student. RLS ensures students can only remove their own rows.
 */
export const removeBiometricCredential = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ credentialId: z.string().min(1) }).parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("biometric_credentials")
      .delete()
      .eq("credential_id", data.credentialId);
    if (error) throw new Error("Could not turn off biometric sign-in. Please try again.");
    return { ok: true as const };
  });
