-- DIAGNOSTIC SCRIPT: CHECK SUPABASE STATE
-- Run this in Supabase SQL Editor to see what's actually going on.

-- 1. Check Table Columns (Verify migrations)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('branches', 'qris_settings') 
AND column_name IN ('settings', 'branch_id')
ORDER BY table_name;

-- 2. Check RLS Policies (Verify permissions)
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('branches', 'workshops', 'qris_settings');

-- 3. Check Custom Functions (Verify RPCs)
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_branch_settings', 'create_new_branch');

-- 4. Check Test User (Verify workshop link)
-- Replace with the username you use to log in (e.g., 'joko')
SELECT id, username, role, workshop_id 
FROM users 
WHERE username = 'joko' OR username = 'owner';

-- 5. Check Braches for that Workshop
-- This will show if branches exist for the workshop found above
SELECT b.id, b.name, b.workshop_id, b.settings, b.is_active
FROM branches b
JOIN users u ON u.workshop_id = b.workshop_id
WHERE u.username = 'joko'; -- Or 'owner'
