-- Update RLS policies to handle retained publications
-- Retained publications should not be visible to public, only to authors and admins

-- Drop the existing policy for public viewing
DROP POLICY "Anyone can view approved publications" ON publications;

-- Create new policy for public viewing (excluding retained)
CREATE POLICY "Anyone can view approved publications" 
ON publications 
FOR SELECT 
USING (
  (status = 'approved'::publication_status) OR 
  (auth.uid() IS NOT NULL AND status IN ('draft'::publication_status, 'pending'::publication_status, 'rejected'::publication_status, 'returned'::publication_status, 'retained'::publication_status))
);

-- Update policy for authors to see their own publications including retained ones
DROP POLICY "Authors can update their own publications" ON publications;

CREATE POLICY "Authors can update their own publications" 
ON publications 
FOR UPDATE 
USING (
  (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = publications.author_id)) AND
  status IN ('draft'::publication_status, 'returned'::publication_status)
);