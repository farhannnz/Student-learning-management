# 🚀 Complete Setup Guide - New Updates

## 📋 **Step-by-Step Process**

### **Step 1: Database Update (5 minutes)**

#### **1.1 Open Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Login to your project
3. Click on **"SQL Editor"** in left sidebar

#### **1.2 Run Database Updates**
Copy and paste this code in SQL Editor:

```sql
-- Add roll_number column to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Create new quiz tables
CREATE TABLE IF NOT EXISTS quiz_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_set_id UUID REFERENCES quiz_sets(id),
    student_id UUID REFERENCES auth.users(id),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_set_id, student_id)
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id),
    selected_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for new tables
CREATE POLICY "Everyone can view quiz sets" ON quiz_sets FOR SELECT USING (true);
CREATE POLICY "Teachers can manage quiz sets" ON quiz_sets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

CREATE POLICY "Everyone can view quiz questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

CREATE POLICY "Students can view own attempts" ON quiz_attempts FOR SELECT USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (
    student_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);

CREATE POLICY "Students can view own answers" ON quiz_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students can insert own answers" ON quiz_answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid())
);
```

#### **1.3 Click "RUN" Button**
- Green success message dikhega
- Agar error aaye to screenshot share karein

---

### **Step 2: Verify Database (2 minutes)**

Run this verification query:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'quiz_sets', 'quiz_questions', 'quiz_attempts', 'quiz_answers')
ORDER BY table_name;

-- Check profiles table structure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Count existing data (should show your current data)
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM materials) as total_materials,
    (SELECT COUNT(*) FROM assignments) as total_assignments;
```

**Expected Result:**
- 5 tables should be listed
- `roll_number` column should appear in profiles
- Your existing data counts should show

---

### **Step 3: Test New Features (10 minutes)**

#### **3.1 Test Roll Number in Signup**
1. Open `signup.html` in browser
2. Select "Student" role
3. Roll number field should appear
4. Create a test student account with roll number

#### **3.2 Test Student Management**
1. Login as teacher
2. Go to **"Students"** tab (new tab)
3. Click **"Add Student"**
4. Fill form with roll number
5. Student should appear in list

#### **3.3 Test Enhanced Quiz System**
1. Login as teacher
2. Go to **"Quizzes"** tab
3. Click **"Create Quiz"**
4. Add quiz title and description
5. Add multiple questions using **"Add Another Question"**
6. Create quiz

#### **3.4 Test Quiz Taking (Student Side)**
1. Login as student
2. Go to **"Quizzes"** tab
3. Take the quiz you created
4. Submit answers

#### **3.5 Test Quiz Results**
1. Login back as teacher
2. Go to **"Quizzes"** tab
3. Click **"View Results"** on your quiz
4. Should show student results with rankings

#### **3.6 Test Assignment Preview**
1. Student submits an assignment
2. Teacher goes to assignment submissions
3. Click **"Preview File"** instead of download
4. File should open in modal

---

### **Step 4: Troubleshooting**

#### **If Database Update Fails:**
```sql
-- Check what went wrong
SELECT * FROM information_schema.tables WHERE table_name LIKE 'quiz%';

-- If tables don't exist, run creation commands one by one
```

#### **If Roll Number Field Not Showing:**
1. Clear browser cache (Ctrl+F5)
2. Check browser console for errors (F12)
3. Make sure you're using updated signup.html

#### **If Quiz Creation Fails:**
1. Check browser console (F12)
2. Make sure database tables were created
3. Check if you're logged in as teacher

#### **If File Preview Not Working:**
1. Check if file was uploaded properly
2. Try different file types (PDF works best)
3. Use "Download" as fallback

---

### **Step 5: Final Verification Checklist**

✅ **Database:**
- [ ] All 5 tables exist
- [ ] roll_number column in profiles
- [ ] Existing data intact

✅ **Signup:**
- [ ] Roll number field appears for students
- [ ] New students can register with roll numbers

✅ **Teacher Features:**
- [ ] Students tab visible
- [ ] Can add students manually
- [ ] Enhanced quiz creation works
- [ ] Can view quiz results with rankings
- [ ] Assignment preview works

✅ **Student Features:**
- [ ] Can take multi-question quizzes
- [ ] Can see quiz results
- [ ] Roll number shows in submissions

---

## 🎯 **Quick Test Scenario**

**Complete Flow Test (5 minutes):**

1. **Create Student** (Teacher):
   - Login as teacher → Students tab → Add Student with roll number

2. **Create Quiz** (Teacher):
   - Quizzes tab → Create Quiz → Add title + 3 questions → Save

3. **Take Quiz** (Student):
   - Login as student → Quizzes tab → Take quiz → Submit

4. **View Results** (Teacher):
   - Login as teacher → Quizzes tab → View Results → See rankings

5. **Test Assignment Preview**:
   - Student submits assignment → Teacher previews file

---

## 🆘 **Need Help?**

**Common Issues:**

1. **"Table already exists" error** = Safe to ignore, means update successful
2. **"Column already exists" error** = Safe to ignore, means already updated  
3. **"Permission denied" error** = Check if you're project owner in Supabase
4. **Website not loading** = Clear browser cache (Ctrl+F5)

**Contact Points:**
- Share screenshot of any errors
- Mention which step failed
- Include browser console errors (F12)

---

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ New student signup shows roll number field
- ✅ Teacher can see "Students" tab
- ✅ Quiz creation has title and multiple questions
- ✅ Quiz results show rankings with medals
- ✅ Assignment submissions show roll numbers
- ✅ File preview opens in modal

**🚀 Ready to use all new features!**