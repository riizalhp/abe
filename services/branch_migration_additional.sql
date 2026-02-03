-- ============================================
-- Migration: Branch ID untuk tabel tambahan
-- ============================================
-- Jalankan setelah branch_migration.sql

-- 1. QRIS Data - Tambahkan branch_id
ALTER TABLE qris_data
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_qris_data_branch ON qris_data (branch_id);

-- Update existing QRIS data dengan main branch
UPDATE qris_data qd
SET
    branch_id = b.id
FROM branches b
WHERE
    qd.workshop_id = b.workshop_id
    AND b.is_main = true
    AND qd.branch_id IS NULL;

-- 2. Moota Settings - Tambahkan branch_id
ALTER TABLE moota_settings
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_moota_settings_branch ON moota_settings (branch_id);

-- Update existing Moota settings dengan main branch
UPDATE moota_settings ms
SET
    branch_id = b.id
FROM branches b
WHERE
    ms.workshop_id = b.workshop_id
    AND b.is_main = true
    AND ms.branch_id IS NULL;

-- 3. Payment Orders - Tambahkan branch_id (jika ada)
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_branch ON payment_orders (branch_id);

-- Update existing payment orders dengan main branch
UPDATE payment_orders po
SET
    branch_id = b.id
FROM branches b
WHERE
    po.workshop_id = b.workshop_id
    AND b.is_main = true
    AND po.branch_id IS NULL;

-- 4. Service Reminders - Tambahkan branch_id
ALTER TABLE service_reminders
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches (id);

CREATE INDEX IF NOT EXISTS idx_service_reminders_branch ON service_reminders (branch_id);

-- Update existing reminders dengan main branch
UPDATE service_reminders sr
SET
    branch_id = b.id
FROM branches b
WHERE
    sr.workshop_id = b.workshop_id
    AND b.is_main = true
    AND sr.branch_id IS NULL;

-- ============================================
-- Selesai! Semua tabel sudah support branch_id
-- ============================================