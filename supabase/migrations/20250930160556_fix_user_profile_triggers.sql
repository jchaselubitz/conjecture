-- Fix: Ensure auth → profile upsert runs with sufficient privileges and on both INSERT/UPDATE
-- Also coalesce email from metadata or user record.

-- 1) Drop old triggers/functions if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_upsert ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_update_user();
DROP FUNCTION IF EXISTS public.handle_upsert_user();

-- 2) Create a single SECURITY DEFINER function for both insert and update
CREATE OR REPLACE FUNCTION public.handle_upsert_user()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
declare
  v_username text;
  v_email text;
  v_picture text;
begin
  -- Extract metadata`
  v_username := (new.raw_user_meta_data::jsonb) ->> 'username';
  v_email := coalesce((new.raw_user_meta_data::jsonb) ->> 'email', new.email);
  v_picture := (new.raw_user_meta_data::jsonb) ->> 'picture';
  
  -- Generate fallback username if not provided (e.g., from OAuth providers)
  if v_username is null or v_username = '' then
    v_username := coalesce(
      split_part(v_email, '@', 1),
      'user'
    ) || '-' || substring(new.id::text from 1 for 6);
  end if;
  
  insert into public.profile (id, username, image_url, email)
  values (
    new.id,
    v_username,
    v_picture,
    v_email
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profile.username),
    image_url = coalesce(excluded.image_url, profile.image_url),
    email = coalesce(excluded.email, profile.email);
  return new;
end;
$$;

-- 3) Create a single trigger for both INSERT and UPDATE on auth.users
CREATE TRIGGER on_auth_user_upsert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_upsert_user();



