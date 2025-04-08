alter table "public"."statement_citation" alter column "author_names" drop not null;

alter table "public"."statement_image" add column "caption" text;


