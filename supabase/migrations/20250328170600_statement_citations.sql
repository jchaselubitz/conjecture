create table "public"."statement_citation" (
    "created_at" timestamp with time zone not null default now(),
    "statement_id" text not null,
    "author_names" text not null,
    "year" timestamp without time zone,
    "title" text not null,
    "title_publication" text,
    "publisher" text,
    "volume" text,
    "issue" smallint,
    "page_start" integer,
    "page_end" integer,
    "url" text,
    "id" text not null
);


alter table "public"."statement_citation" enable row level security;

CREATE UNIQUE INDEX statement_citation_pkey ON public.statement_citation USING btree (id);

alter table "public"."statement_citation" add constraint "statement_citation_pkey" PRIMARY KEY using index "statement_citation_pkey";

grant delete on table "public"."statement_citation" to "anon";

grant insert on table "public"."statement_citation" to "anon";

grant references on table "public"."statement_citation" to "anon";

grant select on table "public"."statement_citation" to "anon";

grant trigger on table "public"."statement_citation" to "anon";

grant truncate on table "public"."statement_citation" to "anon";

grant update on table "public"."statement_citation" to "anon";

grant delete on table "public"."statement_citation" to "authenticated";

grant insert on table "public"."statement_citation" to "authenticated";

grant references on table "public"."statement_citation" to "authenticated";

grant select on table "public"."statement_citation" to "authenticated";

grant trigger on table "public"."statement_citation" to "authenticated";

grant truncate on table "public"."statement_citation" to "authenticated";

grant update on table "public"."statement_citation" to "authenticated";

grant delete on table "public"."statement_citation" to "service_role";

grant insert on table "public"."statement_citation" to "service_role";

grant references on table "public"."statement_citation" to "service_role";

grant select on table "public"."statement_citation" to "service_role";

grant trigger on table "public"."statement_citation" to "service_role";

grant truncate on table "public"."statement_citation" to "service_role";

grant update on table "public"."statement_citation" to "service_role";


