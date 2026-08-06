CREATE TABLE public.transport_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_point text NOT NULL,
  dropoff_point text NOT NULL,
  period text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

GRANT SELECT, INSERT ON public.transport_applications TO authenticated;
GRANT ALL ON public.transport_applications TO service_role;

ALTER TABLE public.transport_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transport applications"
  ON public.transport_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transport applications"
  ON public.transport_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transport_applications_user_created
  ON public.transport_applications (user_id, created_at DESC);