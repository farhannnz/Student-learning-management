-- 🚀 Quick Fix for Attendance Students

-- Step 1: Check if students exist
SELECT COUNT(*) as total_students FROM profiles WHERE role = 'student';

-- Step 2: See all students and their roll numbers
SELECT 
    full_name,
    roll_number,
    created_at
FROM profiles 
WHERE role = 'student' 
ORDER BY full_name;

-- Step 3: Add roll_number column if missing (safe to run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Step 4: Fix students without roll numbers
UPDATE profiles 
SET roll_number = '2024' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0')
WHERE role = 'student' 
AND (roll_number IS NULL OR roll_number = '');

-- Step 5: Verify fix worked
SELECT 
    full_name,
    roll_number,
    'Fixed!' as status
FROM profiles 
WHERE role = 'student' 
ORDER BY roll_number;