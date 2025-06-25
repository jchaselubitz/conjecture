alter table "public"."draft" add column "content_json" jsonb;

CREATE UNIQUE INDEX unique_email_author ON public.subscription USING btree (email, author_id, medium);

CREATE UNIQUE INDEX unique_recipient_author ON public.subscription USING btree (recipient_id, author_id);

alter table "public"."subscription" add constraint "unique_email_author" UNIQUE using index "unique_email_author";

alter table "public"."subscription" add constraint "unique_recipient_author" UNIQUE using index "unique_recipient_author";


