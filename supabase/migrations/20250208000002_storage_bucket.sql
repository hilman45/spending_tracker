-- Storage bucket policies for expense files
-- Run this only AFTER creating the bucket via Supabase Dashboard:
-- Storage -> New bucket -> name: expense-files, Private -> Create bucket

-- Allow authenticated users to upload to their own folder: {user_id}/*
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'expense-files'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'expense-files'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'expense-files'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );
