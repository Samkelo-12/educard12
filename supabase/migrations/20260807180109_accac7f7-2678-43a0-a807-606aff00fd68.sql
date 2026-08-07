CREATE OR REPLACE FUNCTION public.notify_transport_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.user_id, 'Transport application submitted',
          'We received your application for ' || NEW.period || ' (' || NEW.pickup_point || ' to ' || NEW.dropoff_point || '). It is now awaiting review.',
          'transport');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transport_applications_notify_submitted ON public.transport_applications;
CREATE TRIGGER transport_applications_notify_submitted
AFTER INSERT ON public.transport_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_transport_submitted();

CREATE OR REPLACE FUNCTION public.notify_transport_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.user_id, 'Transport application approved',
              'Good news! Your transport application (' || NEW.pickup_point || ' to ' || NEW.dropoff_point || ', ' || NEW.period || ') was approved'
              || COALESCE(' and is valid until ' || to_char(NEW.valid_until, 'DD Mon YYYY'), '') || '. Your shuttle pass is now active.',
              'transport');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.user_id, 'Transport application not approved',
              'Your transport application (' || NEW.pickup_point || ' to ' || NEW.dropoff_point || ', ' || NEW.period || ') was not approved. You may submit a new application.',
              'transport');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;