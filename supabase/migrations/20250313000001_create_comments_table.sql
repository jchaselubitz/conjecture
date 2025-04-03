create table "public"."comment" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "annotation_id" text not null,
    "content" text not null
);

alter table "public"."comment" enable row level security;

CREATE UNIQUE INDEX comment_pkey ON public.comment USING btree (id);

alter table "public"."comment" add constraint "comment_pkey" PRIMARY KEY using index "comment_pkey";

alter table "public"."comment" add constraint "comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."comment" validate constraint "comment_user_id_fkey";

alter table "public"."comment" add constraint "comment_annotation_id_fkey" FOREIGN KEY (annotation_id) REFERENCES public.annotation(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."comment" validate constraint "comment_annotation_id_fkey";

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp_comment BEFORE UPDATE ON public.comment FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Grant permissions
grant delete on table "public"."comment" to "anon";
grant insert on table "public"."comment" to "anon";
grant references on table "public"."comment" to "anon";
grant select on table "public"."comment" to "anon";
grant trigger on table "public"."comment" to "anon";
grant truncate on table "public"."comment" to "anon";
grant update on table "public"."comment" to "anon";

grant delete on table "public"."comment" to "authenticated";
grant insert on table "public"."comment" to "authenticated";
grant references on table "public"."comment" to "authenticated";
grant select on table "public"."comment" to "authenticated";
grant trigger on table "public"."comment" to "authenticated";
grant truncate on table "public"."comment" to "authenticated";
grant update on table "public"."comment" to "authenticated";

grant delete on table "public"."comment" to "service_role";
grant insert on table "public"."comment" to "service_role";
grant references on table "public"."comment" to "service_role";
grant select on table "public"."comment" to "service_role";
grant trigger on table "public"."comment" to "service_role";
grant truncate on table "public"."comment" to "service_role";
grant update on table "public"."comment" to "service_role"; 