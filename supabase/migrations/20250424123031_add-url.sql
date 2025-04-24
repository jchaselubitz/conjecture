create table "public"."statement_url" (
    "slug" text not null,
    "statement_id" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."statement_url" enable row level security;

CREATE UNIQUE INDEX statement_url_pkey ON public.statement_url USING btree (slug);

CREATE UNIQUE INDEX statement_url_statement_id_key ON public.statement_url USING btree (statement_id);

alter table "public"."statement_url" add constraint "statement_url_pkey" PRIMARY KEY using index "statement_url_pkey";

alter table "public"."statement_url" add constraint "statement_url_statement_id_key" UNIQUE using index "statement_url_statement_id_key";

grant delete on table "public"."statement_url" to "anon";

grant insert on table "public"."statement_url" to "anon";

grant references on table "public"."statement_url" to "anon";

grant select on table "public"."statement_url" to "anon";

grant trigger on table "public"."statement_url" to "anon";

grant truncate on table "public"."statement_url" to "anon";

grant update on table "public"."statement_url" to "anon";

grant delete on table "public"."statement_url" to "authenticated";

grant insert on table "public"."statement_url" to "authenticated";

grant references on table "public"."statement_url" to "authenticated";

grant select on table "public"."statement_url" to "authenticated";

grant trigger on table "public"."statement_url" to "authenticated";

grant truncate on table "public"."statement_url" to "authenticated";

grant update on table "public"."statement_url" to "authenticated";

grant delete on table "public"."statement_url" to "service_role";

grant insert on table "public"."statement_url" to "service_role";

grant references on table "public"."statement_url" to "service_role";

grant select on table "public"."statement_url" to "service_role";

grant trigger on table "public"."statement_url" to "service_role";

grant truncate on table "public"."statement_url" to "service_role";

grant update on table "public"."statement_url" to "service_role";


