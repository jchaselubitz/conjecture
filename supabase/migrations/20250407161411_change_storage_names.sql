create policy "All can SELECT statement images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'statement-images'::text));


create policy "Authenticated can INSERT statement images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'statement-images'::text) AND (auth.role() = 'authenticated'::text)));

create policy "All can SELECT user images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'user-images'::text));


create policy "Authenticated can INSERT user images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'user-images'::text) AND (auth.role() = 'authenticated'::text)));



