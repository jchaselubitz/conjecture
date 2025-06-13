alter table "public"."draft" drop constraint "statement_creator_id_fkey";

alter table "public"."draft" alter column "creator_id" drop not null;

alter table "public"."draft" add constraint "draft_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES profile(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."draft" validate constraint "draft_creator_id_fkey";


