CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Prevent updating anything other than the read column
CREATE OR REPLACE FUNCTION public.notifications_only_read_updatable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only the read column can be updated.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notifications_restrict_update
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.notifications_only_read_updatable();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.notify_transport_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.user_id, 'Transport application approved',
              'Your shuttle pass is now active. Tap to view details.', 'transport');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.user_id, 'Transport application update',
              'Your transport application was not approved. Tap for details.', 'transport');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transport_applications_notify_status
AFTER UPDATE OF status ON public.transport_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_transport_status_change();