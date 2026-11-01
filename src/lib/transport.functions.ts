import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ApplicationInput = z.object({
  pickupPoint: z.string().min(1).max(120),
  dropoffPoint: z.string().min(1).max(120),
  period: z.enum(["1st Semester", "2nd Semester", "Full Year"]),
  reason: z.string().max(500).nullish(),
});

/** Submits a transport application for the signed-in student and sends a confirmation push. */
export const submitTransportApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ApplicationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("transport_applications")
      .insert({
        user_id: context.userId,
        pickup_point: data.pickupPoint,
        dropoff_point: data.dropoffPoint,
        period: data.period,
        reason: data.reason?.trim() ? data.reason.trim() : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message || "Could not submit your application. Please try again.");

    // Confirmation push — best effort, never blocks the submission.
    try {
      const { sendPushToUser } = await import("@/lib/push.server");
      await sendPushToUser(
        context.userId,
        "Application received",
        "Your transport application has been submitted and is awaiting review.",
        "/notifications",
      );
    } catch (err) {
      console.error("Submission push failed:", err);
    }

    return { application: row };
  });
