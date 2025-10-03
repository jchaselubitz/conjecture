-- Add RLS policy to allow users to update their own image_url in the profile table

CREATE POLICY "Users can update their own image_url"
ON public.profile
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profile
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can select their own profile"
ON public.profile
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = id);