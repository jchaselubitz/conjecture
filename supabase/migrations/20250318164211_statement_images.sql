create policy "All can SELECT Statement Images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'statement_images'::text));


create policy "Authenticated can INSERT Statement Images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'statement_images'::text) AND (auth.role() = 'authenticated'::text)));



