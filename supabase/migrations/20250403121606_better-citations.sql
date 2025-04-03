alter table "public"."statement_citation" add column "date" timestamp without time zone;

alter table "public"."statement_citation" add column "day" smallint;

alter table "public"."statement_citation" add column "month" smallint;

alter table "public"."statement_citation" alter column "year" set data type smallint using "year"::smallint;

alter table "public"."statement_citation" add constraint "statement_citation_day_check" CHECK (((day > 0) AND (day < 32))) not valid;

alter table "public"."statement_citation" validate constraint "statement_citation_day_check";

alter table "public"."statement_citation" add constraint "statement_citation_month_check" CHECK (((month > 0) AND (month < 13))) not valid;

alter table "public"."statement_citation" validate constraint "statement_citation_month_check";


