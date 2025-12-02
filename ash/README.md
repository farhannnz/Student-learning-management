# Student Learning Management System (SLMS)

A complete Learning Management System built with pure HTML, CSS, JavaScript, and Supabase backend.

## Features

### Authentication
- User registration with role selection (Student/Teacher)
- Secure login with role-based redirection
- Profile management

### Teacher Features
- Upload study materials with files
- Create assignments with deadlines and optional files
- View and download student submissions
- Mark student attendance (Present/Absent)
- Create multiple-choice quizzes
- Send notifications to students
- View quiz results and statistics

### Student Features
- View and download study materials
- View assignments and submit files
- Check personal attendance records
- Take quizzes and view results
- Receive notifications from teachers

## Project Structure

```
slms/
├── index.html          # Login page
├── signup.html         # Registration page
├── student.html        # Student dashboard
├── teacher.html        # Teacher dashboard
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── supabaseClient.js  # Supabase configuration
│   ├── auth.js           # Authentication logic
│   ├── student.js        # Student functionality
│   └── teacher.js        # Teacher functionality
└── README.md           # This file
```

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `js/supabaseClient.js` with your credentials:
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 2. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
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
```

### 3. Storage Setup

Create the following storage buckets in Supabase Dashboard > Storage:

1. **materials** (public bucket)
2. **assignments** (public bucket)  
3. **submissions** (private bucket)

Then add these storage policies in the SQL Editor:

```sql
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
```

### 4. Running the Application

1. Update the Supabase credentials in `js/supabaseClient.js`
2. Serve the files using a local web server (required for file operations)
3. Open `index.html` in your browser

**Local Server Options:**
- Python: `python -m http.server 8000`
- Node.js: `npx serve .`
- PHP: `php -S localhost:8000`
- Live Server extension in VS Code

## Usage

### For Teachers:
1. Sign up with role "Teacher"
2. Login to access teacher dashboard
3. Upload study materials, create assignments, mark attendance
4. Create quizzes and send notifications
5. View student submissions and quiz results

### For Students:
1. Sign up with role "Student"
2. Login to access student dashboard
3. Download study materials, submit assignments
4. Take quizzes and view attendance
5. Receive notifications from teachers

## Technologies Used

- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Supabase (PostgreSQL database, Authentication, Storage)
- **Authentication:** Supabase Auth with Row Level Security
- **File Storage:** Supabase Storage with organized buckets
- **Real-time:** Supabase real-time subscriptions (can be added)

## Security Features

- Row Level Security (RLS) policies
- Role-based access control
- Secure file upload and download
- Input validation and sanitization
- Protected routes and API endpoints

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is open source and available under the MIT License.