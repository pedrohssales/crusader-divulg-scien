-- Fix RLS policy for authors to update file paths
DROP POLICY IF EXISTS "Authors can update their own publications" ON publications;

CREATE POLICY "Authors can update their own publications" 
ON publications 
FOR UPDATE 
USING (
  auth.uid() = (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.id = publications.author_id
  )
) 
WITH CHECK (
  auth.uid() = (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.id = publications.author_id
  )
);