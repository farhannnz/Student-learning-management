# 🗂️ Create Storage Buckets - Step by Step

## ⚠️ **IMPORTANT: Storage buckets are missing!**

You need to create storage buckets in Supabase for file uploads to work.

## 📋 **Steps to Create Buckets:**

### **Step 1: Go to Supabase Dashboard**
1. Open [supabase.com](https://supabase.com)
2. Login to your project
3. Click **"Storage"** in left sidebar

### **Step 2: Create Required Buckets**
Click **"New Bucket"** and create these 3 buckets:

#### **Bucket 1: materials**
- **Name:** `materials`
- **Public:** ✅ **YES** (check the box)
- **File size limit:** 50MB
- **Allowed file types:** Leave empty (all types)

#### **Bucket 2: assignments** 
- **Name:** `assignments`
- **Public:** ✅ **YES** (check the box)
- **File size limit:** 50MB
- **Allowed file types:** Leave empty (all types)

#### **Bucket 3: submissions**
- **Name:** `submissions` 
- **Public:** ❌ **NO** (uncheck the box)
- **File size limit:** 50MB
- **Allowed file types:** Leave empty (all types)

### **Step 3: Verify Buckets Created**
You should see 3 buckets in Storage section:
- ✅ materials (public)
- ✅ assignments (public) 
- ✅ submissions (private)

## 🚨 **Quick Fix Alternative:**

If you can't create buckets manually, run this in Supabase SQL Editor:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('materials', 'materials', true),
    ('assignments', 'assignments', true),
    ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;
```

## ✅ **Test After Creating:**
1. Upload a material as teacher
2. Try to preview/download
3. Should work without "Bucket not found" error

**Create these buckets first, then test file upload/preview!**