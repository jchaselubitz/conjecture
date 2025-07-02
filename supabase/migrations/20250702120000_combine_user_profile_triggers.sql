-- Migration: Combine user profile triggers into a single upsert trigger and function

-- 1. Drop old triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_upsert ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_update_user();

-- 2. Create the new upsert function
CREATE OR REPLACE FUNCTION public.handle_upsert_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
begin
  insert into public.profile (id, username, image_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'picture',
    new.raw_user_meta_data ->> 'email'
  )
  on conflict (id) do update set
    username = excluded.username,
    image_url = excluded.image_url,
    email = excluded.email;
  return new;
end;
$$;

-- 3. Create a single trigger for both insert and update
CREATE TRIGGER on_auth_user_upsert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_upsert_user(); 