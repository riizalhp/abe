-- ============================================
-- FIX: Disable RLS pada tabel branches
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor untuk memperbaiki error RLS

-- Drop existing policies
DROP POLICY IF EXISTS branches_select_policy ON branches;

DROP POLICY IF EXISTS branches_insert_policy ON branches;

DROP POLICY IF EXISTS branches_update_policy ON branches;

DROP POLICY IF EXISTS branches_delete_policy ON branches;

-- Disable RLS karena aplikasi menggunakan custom auth (bukan Supabase Auth)
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- Verifikasi
SELECT tablename, rowsecurity
FROM pg_tables
WHERE
    tablename = 'branches';