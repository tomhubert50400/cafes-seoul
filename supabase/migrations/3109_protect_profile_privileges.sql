-- RLS restricts rows, not columns. Keep privileged profile fields server-managed.
-- Intentionally SECURITY INVOKER: trusted service/definer operations retain access.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role::text <> 'user' OR coalesce(NEW.is_moderator, false) OR coalesce(NEW.is_verified, false) OR coalesce(NEW.is_pro, false) OR NEW.role_updated_at IS NOT NULL THEN
        RAISE EXCEPTION 'Privileged profile fields are server-managed' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.role_updated_at IS DISTINCT FROM OLD.role_updated_at
      OR NEW.is_moderator IS DISTINCT FROM OLD.is_moderator
      OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.is_pro IS DISTINCT FROM OLD.is_pro THEN
      RAISE EXCEPTION 'Privileged profile fields are server-managed' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_profile_privileges
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();
