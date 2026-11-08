CREATE TABLE public.transport_expiry_notifications (
  application_id uuid PRIMARY KEY REFERENCES public.transport_applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON TABLE public.transport_expiry_notifications TO service_role;

ALTER TABLE public.transport_expiry_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_expired_transport_notifications()
RETURNS TABLE (application_id uuid, user_id uuid, valid_until date)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH newly_notified AS (
    INSERT INTO public.transport_expiry_notifications (application_id)
    SELECT ta.id
    FROM public.transport_applications AS ta
    WHERE ta.status = 'approved'
      AND ta.valid_until IS NOT NULL
      AND ta.valid_until < CURRENT_DATE
    ON CONFLICT (application_id) DO NOTHING
    RETURNING application_id
  ), notifications_created AS (
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT
      ta.user_id,
      'Transport pass expired',
      'Your approved transport pass expired on ' || to_char(ta.valid_until, 'DD Mon YYYY') || '. Submit a new transport application if you still need shuttle access.',
      'transport'
    FROM public.transport_applications AS ta
    INNER JOIN newly_notified AS nn ON nn.application_id = ta.id
    RETURNING id
  )
  SELECT ta.id, ta.user_id, ta.valid_until
  FROM newly_notified AS nn
  INNER JOIN public.transport_applications AS ta ON ta.id = nn.application_id;
$$;

REVOKE ALL ON FUNCTION public.record_expired_transport_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_expired_transport_notifications() TO service_role;