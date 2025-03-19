alter table "public"."profile" add column "username" text not null;

CREATE UNIQUE INDEX profile_username_key ON public.profile USING btree (username);

alter table "public"."profile" add constraint "profile_username_key" UNIQUE using index "profile_username_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profile (id, username, image_url)
  values (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'picture');
  return new;
end;
$function$
;


