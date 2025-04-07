create policy "All can SELECT Statement Images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'statement-images'::text));


create policy "Authenticated can INSERT Statement Images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'statement-images'::text) AND (auth.role() = 'authenticated'::text)));

create policy "All can SELECT 1rp6lws_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'user-images'::text));


create policy "Authenticated can INSERT 1rp6lws_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'user-images'::text) AND (auth.role() = 'authenticated'::text)));



