// Supabase Configuration
// Replace YOUR_SUPABASE_ANON_KEY with your actual anon key from Supabase dashboard
const SUPABASE_URL = 'https://fhxptqayjgpyzhzcygfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeHB0cWF5amdweXpoemN5Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDMyOTcsImV4cCI6MjA3OTg3OTI5N30.Rg5LfxJ_v77avQrsDTmsZA-D9_E-DIdx1RdwPsZSesc';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket names
const STORAGE_BUCKETS = {
    MATERIALS: 'materials',
    ASSIGNMENTS: 'assignments',
    SUBMISSIONS: 'submissions'
};

// Helper function to show messages
function showMessage(elementId, message, type = 'error') {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        // Auto hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Helper function to check if user is authenticated
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Helper function to get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

// Helper function to upload file to storage
async function uploadFile(bucket, file, path) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    return data;
}

// Helper function to get file URL from storage
async function getFileUrl(bucket, path) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
}

// Helper function to download file
async function downloadFile(bucket, path, filename) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

    if (error) {
        console.error('Download error:', error);
        return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Database setup SQL (for reference - run this in Supabase SQL editor)
const DATABASE_SETUP_SQL = `
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    file_path TEXT,
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES auth.users(id),
    file_path TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id),
    student_id UUID REFERENCES auth.users(id),
    selected_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, student_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_role TEXT NOT NULL CHECK (target_role IN ('student', 'teacher', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Materials policies
CREATE POLICY "Everyone can view materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Teachers can insert materials" ON materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own materials" ON materials FOR UPDATE USING (
    uploaded_by = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Assignments policies
CREATE POLICY "Everyone can view assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Teachers can insert assignments" ON assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own assignments" ON assignments FOR UPDATE USING (
    teacher_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Submissions policies
CREATE POLICY "Students can view own submissions" ON submissions FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students can insert own submissions" ON submissions FOR INSERT WITH CHECK (
    student_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);

-- Attendance policies
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can manage attendance" ON attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Quizzes policies
CREATE POLICY "Everyone can view quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Teachers can manage quizzes" ON quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Quiz results policies
CREATE POLICY "Students can view own results" ON quiz_results FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students can insert own results" ON quiz_results FOR INSERT WITH CHECK (
    student_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);

-- Notifications policies
CREATE POLICY "Users can view relevant notifications" ON notifications FOR SELECT USING (
    target_role = 'all' OR 
    target_role = (SELECT role FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Teachers can create notifications" ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Create storage buckets (run these in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Storage policies
-- CREATE POLICY "Anyone can view materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
-- CREATE POLICY "Teachers can upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
-- CREATE POLICY "Anyone can view assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
-- CREATE POLICY "Teachers can upload assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
-- CREATE POLICY "Students can upload submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
-- CREATE POLICY "Users can view relevant submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')));
`;

console.log('Supabase client initialized');
console.log('Database setup SQL available in DATABASE_SETUP_SQL variable');