

CREATE OR REPLACE FUNCTION public.handle_upsert_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
  v_email    text;
  v_picture  text;
  v_name     text;
BEGIN
  -- Extract metadata
  v_username := (NEW.raw_user_meta_data::jsonb)->>'username';
  v_email    := COALESCE((NEW.raw_user_meta_data::jsonb)->>'email', NEW.email);
  v_picture  := (NEW.raw_user_meta_data::jsonb)->>'picture';

  v_name := COALESCE(
    NULLIF((NEW.raw_user_meta_data::jsonb)->>'name',''),
    NULLIF((NEW.raw_user_meta_data::jsonb)->>'full_name',''),
    NULLIF(
      trim(
        COALESCE((NEW.raw_user_meta_data::jsonb)->>'given_name','') || ' ' ||
        COALESCE((NEW.raw_user_meta_data::jsonb)->>'family_name','')
      ), ''
    )
  );

  -- Fallback username if missing
  IF v_username IS NULL OR v_username = '' THEN
    v_username := COALESCE(split_part(v_email, '@', 1), 'user') || '-' ||
                  substring(NEW.id::text from 1 for 6);
  END IF;

  INSERT INTO public.profile (id, username, image_url, email, name)
  VALUES (NEW.id, v_username, v_picture, v_email, v_name)
  ON CONFLICT (id) DO UPDATE
    SET username = COALESCE(EXCLUDED.username, profile.username),
        image_url = COALESCE(EXCLUDED.image_url, profile.image_url),
        email     = COALESCE(EXCLUDED.email, profile.email),
        name      = COALESCE(EXCLUDED.name, profile.name);

  RETURN NEW;
END;
$function$
;


-- CREATE OR REPLACE FUNCTION public.handle_sync_user_update()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- SET search_path = public, auth
-- AS $function$
-- DECLARE
--   v_username text;
--   v_email    text;
--   v_picture  text;
--   v_name     text;
-- BEGIN
--   -- Fast exit if no profile row yet (avoids race with INSERT flow)
--   PERFORM 1 FROM public.profile WHERE id = NEW.id;
--   IF NOT FOUND THEN
--     RETURN NEW; -- skip
--   END IF;

--   -- Extract metadata
--   v_username := (NEW.raw_user_meta_data::jsonb)->>'username';
--   v_email    := COALESCE((NEW.raw_user_meta_data::jsonb)->>'email', NEW.email);
--   v_picture  := (NEW.raw_user_meta_data::jsonb)->>'picture';
--   v_name := COALESCE(
--     NULLIF((NEW.raw_user_meta_data::jsonb)->>'name',''),
--     NULLIF((NEW.raw_user_meta_data::jsonb)->>'full_name',''),
--     NULLIF(trim(
--       COALESCE((NEW.raw_user_meta_data::jsonb)->>'given_name','') || ' ' ||
--       COALESCE((NEW.raw_user_meta_data::jsonb)->>'family_name','')
--     ), '')
--   );


--   -- Update only what we have; never overwrite with NULL
--   UPDATE public.profile
--   SET
--     username   = COALESCE(v_username, username),
--     image_url  = COALESCE(v_picture,  image_url),
--     email      = COALESCE(v_email,    email),
--     name       = COALESCE(v_name,     name),
--     updated_at = now()
--   WHERE id = NEW.id;

--   RETURN NEW;
-- END;
-- $function$
-- ;


-- CREATE POLICY profile_definer_insert
-- ON public.profile
-- AS PERMISSIVE
-- FOR INSERT
-- TO postgres
-- WITH CHECK (true);

-- CREATE POLICY profile_definer_update
-- ON public.profile
-- AS PERMISSIVE
-- FOR UPDATE
-- TO postgres
-- USING (true)
-- WITH CHECK (true);

-- GRANT INSERT, UPDATE, SELECT ON public.profile TO postgres;


-- CREATE TRIGGER on_auth_user_sync_update
-- AFTER UPDATE OF email, raw_user_meta_data ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_sync_user_update();

