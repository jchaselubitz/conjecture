create table "public"."comment_vote" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "comment_id" uuid not null
);


alter table "public"."comment_vote" enable row level security;

alter table "public"."comment" add column "parent_id" uuid;

CREATE UNIQUE INDEX comment_vote_user_comment_unique ON public.comment_vote USING btree (user_id, comment_id);

CREATE UNIQUE INDEX upvote_pkey ON public.comment_vote USING btree (id);

alter table "public"."comment_vote" add constraint "upvote_pkey" PRIMARY KEY using index "upvote_pkey";

alter table "public"."comment" add constraint "comment_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES comment(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."comment" validate constraint "comment_parent_id_fkey";

alter table "public"."comment_vote" add constraint "comment_vote_user_comment_unique" UNIQUE using index "comment_vote_user_comment_unique";

alter table "public"."comment_vote" add constraint "upvote_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES comment(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."comment_vote" validate constraint "upvote_comment_id_fkey";

alter table "public"."comment_vote" add constraint "upvote_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."comment_vote" validate constraint "upvote_user_id_fkey";

grant delete on table "public"."comment_vote" to "anon";

grant insert on table "public"."comment_vote" to "anon";

grant references on table "public"."comment_vote" to "anon";

grant select on table "public"."comment_vote" to "anon";

grant trigger on table "public"."comment_vote" to "anon";

grant truncate on table "public"."comment_vote" to "anon";

grant update on table "public"."comment_vote" to "anon";

grant delete on table "public"."comment_vote" to "authenticated";

grant insert on table "public"."comment_vote" to "authenticated";

grant references on table "public"."comment_vote" to "authenticated";

grant select on table "public"."comment_vote" to "authenticated";

grant trigger on table "public"."comment_vote" to "authenticated";

grant truncate on table "public"."comment_vote" to "authenticated";

grant update on table "public"."comment_vote" to "authenticated";

grant delete on table "public"."comment_vote" to "service_role";

grant insert on table "public"."comment_vote" to "service_role";

grant references on table "public"."comment_vote" to "service_role";

grant select on table "public"."comment_vote" to "service_role";

grant trigger on table "public"."comment_vote" to "service_role";

grant truncate on table "public"."comment_vote" to "service_role";

grant update on table "public"."comment_vote" to "service_role";


