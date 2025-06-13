alter table "public"."collaborator" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."statement" add column "updated_at" timestamp with time zone not null default now();


