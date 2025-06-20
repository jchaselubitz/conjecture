alter table "public"."subscription" drop constraint "subscription_unique_combo";

drop index if exists "public"."subscription_unique_combo";

alter table "public"."profile" add column "email" text;

alter table "public"."subscription" drop column "handle";

CREATE UNIQUE INDEX profile_email_key ON public.profile USING btree (email);

alter table "public"."profile" add constraint "profile_email_key" UNIQUE using index "profile_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_update_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Upsert into profile table using the latest metadata
  insert into public.profile (id, username, image_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'picture',
    new.email
  )
  on conflict (id) do update set
    username = excluded.username,
    image_url = excluded.image_url,
    email = excluded.email;

  return new;
end;
$function$
;

create trigger on_auth_user_changed
after update on auth.users
for each row
when (
  old.email is distinct from new.email or
  old.raw_user_meta_data is distinct from new.raw_user_meta_data
)
execute function public.handle_update_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
  insert into public.profile (id, username, image_url, email)
  values (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'picture', new.raw_user_meta_data ->> 'email');
  return new;
end;$function$
;


