# 🔄 Database Migration Guide

## ⚠️ **Important: Your Data is Safe!**

Ye migration process aapka **existing data delete nahi karega**. Sirf new features add karega.

## 📋 **Migration Steps:**

### **Step 1: Run Database Updates**
Supabase SQL Editor mein ye code run karein:

```sql
-- Copy and paste the content from database-update.sql
-- This will add new columns and tables safely
```

### **Step 2: Verify Migration**
Check karne ke liye:

1. **Profiles Table:**
   ```sql
   SELECT * FROM profiles LIMIT 5;
   ```
   - `roll_number` column add ho gaya hoga
   - Existing data intact rahega

2. **New Quiz Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'quiz%';
   ```
   - `quiz_sets`, `quiz_questions`, `quiz_attempts`, `quiz_answers` tables dikhenge

### **Step 3: Optional - Migrate Old Quiz Data**
Agar aapke paas purane quizzes hain:

```sql
-- Check if old quizzes table exists
SELECT COUNT(*) FROM quizzes;

-- If you want to migrate old quizzes to new format:
-- (Run this only if you have old quiz data)
INSERT INTO quiz_sets (title, description, teacher_id, created_at)
SELECT 
    'Quiz - ' || LEFT(question, 50) as title,
    'Migrated from old quiz system' as description,
    teacher_id,
    created_at
FROM quizzes;

-- Then migrate questions
INSERT INTO quiz_questions (quiz_set_id, question, options, correct_index, created_at)
SELECT 
    qs.id as quiz_set_id,
    q.question,
    q.options,
    q.correct_index,
    q.created_at
FROM quizzes q
JOIN quiz_sets qs ON qs.teacher_id = q.teacher_id 
AND qs.created_at = q.created_at;
```

## ✅ **What's Safe:**

- **Existing users** - Sab login kar sakte hain
- **Materials** - Sab files safe hain
- **Assignments** - Sab assignments intact hain
- **Attendance** - Sab records safe hain
- **Notifications** - Sab messages safe hain

## 🆕 **What's New:**

- **Roll Numbers** - Students ke paas roll number field
- **Enhanced Quizzes** - Multiple questions per quiz
- **Better Results** - Rankings aur detailed analytics
- **Student Management** - Teachers can add students
- **File Preview** - Assignment files preview kar sakte hain

## 🔍 **Verification Commands:**

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check profiles structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Count existing data
SELECT 
    (SELECT COUNT(*) FROM profiles) as users,
    (SELECT COUNT(*) FROM materials) as materials,
    (SELECT COUNT(*) FROM assignments) as assignments,
    (SELECT COUNT(*) FROM attendance) as attendance_records;
```

## 🚨 **If Something Goes Wrong:**

1. **Backup nahi chahiye** - Supabase automatic backups rakhta hai
2. **Rollback** - Sirf new tables delete kar sakte hain:
   ```sql
   DROP TABLE IF EXISTS quiz_answers;
   DROP TABLE IF EXISTS quiz_attempts;
   DROP TABLE IF EXISTS quiz_questions;
   DROP TABLE IF EXISTS quiz_sets;
   ```
3. **Support** - Koi problem ho to contact karein

## 📞 **Quick Test:**

Migration ke baad:
1. Login kar ke check karein
2. Old materials/assignments accessible hain
3. New quiz creation test karein
4. Student add karne ka test karein

**🎉 Migration complete hone ke baad sab features ready hain!**