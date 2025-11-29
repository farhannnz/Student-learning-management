-- Storage policies for materials bucket
CREATE POLICY "Anyone can view materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Teachers can upload materials" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Storage policies for assignments bucket
CREATE POLICY "Anyone can view assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
CREATE POLICY "Teachers can upload assignments" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'assignments' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Storage policies for submissions bucket
CREATE POLICY "Students can upload submissions" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'submissions' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);
CREATE POLICY "Users can view relevant submissions" ON storage.objects FOR SELECT USING (
    bucket_id = 'submissions' AND (
        auth.uid()::text = (storage.foldername(name))[1] OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    )
);