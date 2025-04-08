create policy "User can DELETE statement image"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'statement-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "User can UPDATE statement image"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'statement-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "User can DELETE user image"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'user-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "User can UPDATE user image"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'user-images'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));




