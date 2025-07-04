alter table "public"."statement_citation" add column "text" text;

alter table "public"."statement_citation" alter column "title" drop not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_upsert_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;


