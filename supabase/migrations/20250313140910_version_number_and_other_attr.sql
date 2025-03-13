alter table "public"."draft" add column "published_at" timestamp with time zone;

alter table "public"."draft" add column "subtitle" text;

alter table "public"."draft" add column "version_number" smallint not null default '1'::smallint;

alter table "public"."draft" alter column "content" drop not null;

alter table "public"."draft" alter column "title" drop not null;

CREATE UNIQUE INDEX unique_statement_version ON public.draft USING btree (statement_id, version_number);

alter table "public"."draft" add constraint "unique_statement_version" UNIQUE using index "unique_statement_version";


