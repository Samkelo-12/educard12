import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TokenInput = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

/** Stores the device's push registration token for the signed-in student. */
export const registerPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TokenInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Remove any stale registration for the same token (e.g. a device that
    // signed in with a different account) before saving this user's token.
    await supabaseAdmin.from("push_tokens").delete().eq("token", data.token);
    const { error } = await supabaseAdmin
      .from("push_tokens")
      .upsert(
        { token: data.token, user_id: context.userId, platform: data.platform },
        { onConflict: "token" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Removes this device's token (used when the student turns push off). */
export const removePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TokenInput.pick({ token: true }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("push_tokens").delete().eq("token", data.token).eq("user_id", context.userId);
    return { ok: true as const };
  });
