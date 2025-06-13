alter table "public"."draft" drop column "header_img";

alter table "public"."draft" drop column "subtitle";

alter table "public"."draft" drop column "thread_id";

alter table "public"."draft" drop column "title";

alter table "public"."statement" add column "creator_id" uuid not null;

alter table "public"."statement" add column "header_img" text;

alter table "public"."statement" add column "subtitle" text;

alter table "public"."statement" add column "thread_id" text;

alter table "public"."statement" add column "title" text;

alter table "public"."statement" add constraint "statement_creator_id_fkey1" FOREIGN KEY (creator_id) REFERENCES profile(id) ON DELETE RESTRICT not valid;

alter table "public"."statement" validate constraint "statement_creator_id_fkey1";


