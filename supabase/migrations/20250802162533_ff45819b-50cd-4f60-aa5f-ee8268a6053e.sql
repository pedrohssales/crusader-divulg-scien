-- Create storage policies for the publications bucket

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload their own publications" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'publications' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to view files they uploaded
CREATE POLICY "Users can view their own publication files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'publications' 
  AND auth.uid() IS NOT NULL
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all publication files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'publications' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Allow public access to files of approved publications
CREATE POLICY "Public can view approved publication files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'publications' 
  AND EXISTS (
    SELECT 1 FROM publications p 
    WHERE p.file_path = name 
    AND p.status = 'approved'
  )
);