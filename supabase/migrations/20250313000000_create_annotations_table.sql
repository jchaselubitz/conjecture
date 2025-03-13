create table "public"."annotation" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "draft_id" bigint not null,
    "start" integer not null,
    "end" integer not null,
    "text" text not null,
    "tag" text not null
);

alter table "public"."annotation" enable row level security;

CREATE UNIQUE INDEX annotation_pkey ON public.annotation USING btree (id);

alter table "public"."annotation" add constraint "annotation_pkey" PRIMARY KEY using index "annotation_pkey";

alter table "public"."annotation" add constraint "annotation_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."annotation" validate constraint "annotation_user_id_fkey";

alter table "public"."annotation" add constraint "annotation_draft_id_fkey" FOREIGN KEY (draft_id) REFERENCES public.draft(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."annotation" validate constraint "annotation_draft_id_fkey";

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp_annotation BEFORE UPDATE ON public.annotation FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Grant permissions
grant delete on table "public"."annotation" to "anon";
grant insert on table "public"."annotation" to "anon";
grant references on table "public"."annotation" to "anon";
grant select on table "public"."annotation" to "anon";
grant trigger on table "public"."annotation" to "anon";
grant truncate on table "public"."annotation" to "anon";
grant update on table "public"."annotation" to "anon";

grant delete on table "public"."annotation" to "authenticated";
grant insert on table "public"."annotation" to "authenticated";
grant references on table "public"."annotation" to "authenticated";
grant select on table "public"."annotation" to "authenticated";
grant trigger on table "public"."annotation" to "authenticated";
grant truncate on table "public"."annotation" to "authenticated";
grant update on table "public"."annotation" to "authenticated";

grant delete on table "public"."annotation" to "service_role";
grant insert on table "public"."annotation" to "service_role";
grant references on table "public"."annotation" to "service_role";
grant select on table "public"."annotation" to "service_role";
grant trigger on table "public"."annotation" to "service_role";
grant truncate on table "public"."annotation" to "service_role";
grant update on table "public"."annotation" to "service_role"; 