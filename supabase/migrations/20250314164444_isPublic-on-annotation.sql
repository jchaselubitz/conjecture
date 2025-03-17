alter table "public"."annotation" add column "is_public" boolean not null default false;

alter table "public"."annotation" alter column "tag" drop not null;


