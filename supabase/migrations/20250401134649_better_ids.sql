alter table "public"."annotation" alter column "id" drop default;

alter table "public"."annotation" alter column "id" set data type text using "id"::text;

alter table "public"."comment" alter column "annotation_id" set data type text using "annotation_id"::text;

alter table "public"."statement_image" alter column "id" set data type text using "id"::text;


