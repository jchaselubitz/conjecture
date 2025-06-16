CREATE UNIQUE INDEX collaborator_pkey ON public.collaborator USING btree (id);

alter table "public"."collaborator" add constraint "collaborator_pkey" PRIMARY KEY using index "collaborator_pkey";


