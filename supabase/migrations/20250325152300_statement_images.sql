create table "public"."statement_image" (
    "created_at" timestamp with time zone not null default now(),
    "src" text not null,
    "alt" text,
    "statement_id" text not null,
    "id" uuid not null,
    "creator_id" uuid not null
);


alter table "public"."statement_image" enable row level security;

CREATE UNIQUE INDEX statement_image_pkey ON public.statement_image USING btree (id);

alter table "public"."statement_image" add constraint "statement_image_pkey" PRIMARY KEY using index "statement_image_pkey";

alter table "public"."statement_image" add constraint "statement_image_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."statement_image" validate constraint "statement_image_creator_id_fkey";

grant delete on table "public"."statement_image" to "anon";

grant insert on table "public"."statement_image" to "anon";

grant references on table "public"."statement_image" to "anon";

grant select on table "public"."statement_image" to "anon";

grant trigger on table "public"."statement_image" to "anon";

grant truncate on table "public"."statement_image" to "anon";

grant update on table "public"."statement_image" to "anon";

grant delete on table "public"."statement_image" to "authenticated";

grant insert on table "public"."statement_image" to "authenticated";

grant references on table "public"."statement_image" to "authenticated";

grant select on table "public"."statement_image" to "authenticated";

grant trigger on table "public"."statement_image" to "authenticated";

grant truncate on table "public"."statement_image" to "authenticated";

grant update on table "public"."statement_image" to "authenticated";

grant delete on table "public"."statement_image" to "service_role";

grant insert on table "public"."statement_image" to "service_role";

grant references on table "public"."statement_image" to "service_role";

grant select on table "public"."statement_image" to "service_role";

grant trigger on table "public"."statement_image" to "service_role";

grant truncate on table "public"."statement_image" to "service_role";

grant update on table "public"."statement_image" to "service_role";


