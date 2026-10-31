CREATE TABLE public.biometric_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  token_hash text NOT NULL UNIQUE,
  device_label text NOT NULL DEFAULT 'This device',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX biometric_credentials_user_idx ON public.biometric_credentials(user_id);
GRANT SELECT, DELETE ON public.biometric_credentials TO authenticated;
GRANT ALL ON public.biometric_credentials TO service_role;
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY biometric_credentials_select_own ON public.biometric_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY biometric_credentials_delete_own ON public.biometric_credentials FOR DELETE TO authenticated USING (auth.uid() = user_id);