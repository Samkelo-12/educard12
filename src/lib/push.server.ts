// Server-only push delivery helper. Imported from inside createServerFn
// handlers and server route handlers — never from the client bundle.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

type SendResult = { sent: number; removed: number };

/**
 * Sends a push notification to every device registered by the given user.
 * Stale tokens (uninstalled apps, revoked permissions) are cleaned up
 * automatically when FCM reports them as unregistered.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  path = "/notifications",
): Promise<SendResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !connectionKey) {
    console.warn("Push skipped: Firebase connector credentials not configured");
    return { sent: 0, removed: 0 };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: tokens, error } = await supabaseAdmin
    .from("push_tokens")
    .select("id, token")
    .eq("user_id", userId);
  if (error) {
    console.error("Push token lookup failed:", error.message);
    return { sent: 0, removed: 0 };
  }
  if (!tokens || tokens.length === 0) return { sent: 0, removed: 0 };

  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    tokens.map(async (row: { id: string; token: string }) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: {
              token: row.token,
              notification: { title, body },
              data: { path },
            },
          }),
        });
        if (res.ok) {
          sent += 1;
          return;
        }
        const errBody = await res.text();
        console.error(`FCM send failed [${res.status}]: ${errBody}`);
        if (res.status === 404 && errBody.includes("UNREGISTERED")) {
          stale.push(row.token);
        }
      } catch (err) {
        console.error("FCM send threw:", err);
      }
    }),
  );

  if (stale.length > 0) {
    await supabaseAdmin.from("push_tokens").delete().in("token", stale);
  }

  return { sent, removed: stale.length };
}
