create table "public"."statement_vote" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "statement_id" text not null
);


alter table "public"."statement_vote" enable row level security;

CREATE UNIQUE INDEX statement_upvote_pkey ON public.statement_vote USING btree (id);

CREATE UNIQUE INDEX statement_upvote_user_id_statement_id_key ON public.statement_vote USING btree (user_id, statement_id);

alter table "public"."statement_vote" add constraint "statement_upvote_pkey" PRIMARY KEY using index "statement_upvote_pkey";

alter table "public"."statement_vote" add constraint "statement_upvote_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."statement_vote" validate constraint "statement_upvote_user_id_fkey";

alter table "public"."statement_vote" add constraint "statement_upvote_user_id_statement_id_key" UNIQUE using index "statement_upvote_user_id_statement_id_key";

grant delete on table "public"."statement_vote" to "anon";

grant insert on table "public"."statement_vote" to "anon";

grant references on table "public"."statement_vote" to "anon";

grant select on table "public"."statement_vote" to "anon";

grant trigger on table "public"."statement_vote" to "anon";

grant truncate on table "public"."statement_vote" to "anon";

grant update on table "public"."statement_vote" to "anon";

grant delete on table "public"."statement_vote" to "authenticated";

grant insert on table "public"."statement_vote" to "authenticated";

grant references on table "public"."statement_vote" to "authenticated";

grant select on table "public"."statement_vote" to "authenticated";

grant trigger on table "public"."statement_vote" to "authenticated";

grant truncate on table "public"."statement_vote" to "authenticated";

grant update on table "public"."statement_vote" to "authenticated";

grant delete on table "public"."statement_vote" to "service_role";

grant insert on table "public"."statement_vote" to "service_role";

grant references on table "public"."statement_vote" to "service_role";

grant select on table "public"."statement_vote" to "service_role";

grant trigger on table "public"."statement_vote" to "service_role";

grant truncate on table "public"."statement_vote" to "service_role";

grant update on table "public"."statement_vote" to "service_role";


