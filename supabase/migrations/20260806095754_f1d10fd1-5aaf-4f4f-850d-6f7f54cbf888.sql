ALTER TABLE public.transport_applications ADD COLUMN IF NOT EXISTS valid_until date;

CREATE OR REPLACE FUNCTION public.set_transport_valid_until()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  p text := lower(replace(coalesce(NEW.period, ''), ' ', '_'));
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;
    IF p = 'full_year' THEN
      NEW.valid_until := (NEW.reviewed_at::date + INTERVAL '12 months')::date;
    ELSE
      NEW.valid_until := (NEW.reviewed_at::date + INTERVAL '6 months')::date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transport_applications_set_valid_until ON public.transport_applications;
CREATE TRIGGER transport_applications_set_valid_until
BEFORE INSERT OR UPDATE ON public.transport_applications
FOR EACH ROW EXECUTE FUNCTION public.set_transport_valid_until();

CREATE OR REPLACE FUNCTION public.check_transport_reapply_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  last_app public.transport_applications%ROWTYPE;
BEGIN
  SELECT * INTO last_app
  FROM public.transport_applications
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF last_app.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  IF last_app.status = 'approved' AND last_app.valid_until IS NOT NULL AND last_app.valid_until < CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  IF last_app.status = 'approved' THEN
    RAISE EXCEPTION 'You already have an approved transport application that is still valid.';
  END IF;

  RAISE EXCEPTION 'You already have a transport application awaiting review.';
END;
$$;

DROP TRIGGER IF EXISTS transport_applications_check_eligibility ON public.transport_applications;
CREATE TRIGGER transport_applications_check_eligibility
BEFORE INSERT ON public.transport_applications
FOR EACH ROW EXECUTE FUNCTION public.check_transport_reapply_eligibility();