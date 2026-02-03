-- ============================================
-- Migration: Multi-Branch / Multi-Cabang
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Tabel branches (Cabang)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    workshop_id UUID NOT NULL REFERENCES workshops (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_branches_workshop ON branches (workshop_id);

CREATE INDEX IF NOT EXISTS idx_branches_code ON branches (code);

CREATE INDEX IF NOT EXISTS idx_branches_active ON branches (is_active);

-- 2. Tambahkan branch_id ke tabel operasional

-- Service Records
ALTER TABLE service_records
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_service_records_branch ON service_records (branch_id);

-- Bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_bookings_branch ON bookings (branch_id);

-- Users (untuk assign user ke cabang tertentu, opsional)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_users_branch ON users (branch_id);

-- 3. Function untuk auto-create main branch saat workshop dibuat
CREATE OR REPLACE FUNCTION create_main_branch()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO branches (workshop_id, name, code, address, phone, is_main, is_active)
  VALUES (
    NEW.id,
    NEW.name || ' - Pusat',
    UPPER(SUBSTRING(REPLACE(NEW.name, ' ', ''), 1, 5)) || '-MAIN',
    NEW.address,
    NEW.phone,
    true,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-create main branch
DROP TRIGGER IF EXISTS trigger_create_main_branch ON workshops;

CREATE TRIGGER trigger_create_main_branch
  AFTER INSERT ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION create_main_branch();

-- 4. Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_branch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_branch_timestamp ON branches;

CREATE TRIGGER trigger_update_branch_timestamp
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_timestamp();

-- 5. Row Level Security (RLS) untuk branches
-- CATATAN: Karena aplikasi menggunakan custom auth (bukan Supabase Auth),
-- kita disable RLS dan mengandalkan application-level security
-- Jika ingin menggunakan Supabase Auth di masa depan, enable RLS dan sesuaikan policies

-- Disable RLS karena tidak menggunakan Supabase Auth
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- Alternatif: Jika menggunakan Supabase Auth, uncomment policies di bawah ini
-- ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT - semua authenticated user bisa lihat branches
-- CREATE POLICY branches_select_policy ON branches
--   FOR SELECT USING (true);

-- Policy untuk INSERT - semua authenticated user bisa insert
-- CREATE POLICY branches_insert_policy ON branches
--   FOR INSERT WITH CHECK (true);

-- Policy untuk UPDATE - semua authenticated user bisa update
-- CREATE POLICY branches_update_policy ON branches
--   FOR UPDATE USING (true);

-- Policy untuk DELETE - tidak bisa hapus cabang utama
-- CREATE POLICY branches_delete_policy ON branches
--   FOR DELETE USING (is_main = false);

-- 6. Migrate existing workshops (buat main branch untuk yang sudah ada)
INSERT INTO branches (workshop_id, name, code, address, phone, is_main, is_active)
SELECT 
  id,
  name || ' - Pusat',
  UPPER(SUBSTRING(REPLACE(name, ' ', ''), 1, 5)) || '-MAIN-' || SUBSTRING(id::text, 1, 4),
  address,
  phone,
  true,
  true
FROM workshops w
WHERE NOT EXISTS (
  SELECT 1 FROM branches b WHERE b.workshop_id = w.id
);

-- 7. Update existing records dengan branch_id (set ke main branch)
UPDATE service_records sr
SET
    branch_id = b.id
FROM branches b
WHERE
    sr.workshop_id = b.workshop_id
    AND b.is_main = true
    AND sr.branch_id IS NULL;

UPDATE bookings bk
SET
    branch_id = b.id
FROM branches b
WHERE
    bk.workshop_id = b.workshop_id
    AND b.is_main = true
    AND bk.branch_id IS NULL;

UPDATE users u
SET
    branch_id = b.id
FROM branches b
WHERE
    u.workshop_id = b.workshop_id
    AND b.is_main = true
    AND u.branch_id IS NULL;

-- ============================================
-- Selesai! Multi-Branch ready to use
-- ============================================