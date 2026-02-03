-- ============================================
-- QUICK FIX: Tambah kolom yang hilang
-- Jalankan ini di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom branch_id ke reminders (jika belum ada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reminders' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE reminders ADD COLUMN branch_id UUID;
    END IF;
END $$;

-- 2. Tambah kolom branch_id ke service_reminders (jika ada tabel ini)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_reminders') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_reminders' AND column_name = 'branch_id'
        ) THEN
            ALTER TABLE service_reminders ADD COLUMN branch_id UUID;
        END IF;
    END IF;
END $$;

-- 3. Tambah kolom branch_id ke users (jika belum ada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE users ADD COLUMN branch_id UUID;
    END IF;
END $$;

-- 4. Tambah kolom branch_id ke service_records (jika belum ada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_records' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE service_records ADD COLUMN branch_id UUID;
    END IF;
END $$;

-- 5. Tambah kolom branch_id ke bookings (jika belum ada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN branch_id UUID;
    END IF;
END $$;

-- 6. Tambah kolom branch_id ke qris_data (jika tabel dan kolom belum ada)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qris_data') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'qris_data' AND column_name = 'branch_id'
        ) THEN
            ALTER TABLE qris_data ADD COLUMN branch_id UUID;
        END IF;
    END IF;
END $$;

-- 7. Tambah kolom branch_id ke moota_settings (jika tabel dan kolom belum ada)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moota_settings') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'moota_settings' AND column_name = 'branch_id'
        ) THEN
            ALTER TABLE moota_settings ADD COLUMN branch_id UUID;
        END IF;
    END IF;
END $$;

-- Selesai! Refresh browser setelah menjalankan ini