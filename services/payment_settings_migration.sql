-- ============================================
-- PAYMENT SETTINGS MIGRATION
-- Create tables untuk payment settings
-- ============================================

-- 1. Create workshop_settings table
CREATE TABLE IF NOT EXISTS workshop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    booking_fee INTEGER DEFAULT 25000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id)
);

-- 2. Create moota_settings table
CREATE TABLE IF NOT EXISTS moota_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    moota_api_key TEXT,
    bank_account_id TEXT,
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_workshop_settings_workshop ON workshop_settings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_moota_settings_workshop ON moota_settings(workshop_id);

-- 4. Insert default settings untuk workshop yang sudah ada
INSERT INTO workshop_settings (workshop_id, booking_fee)
SELECT id, 10000
FROM workshops
WHERE id NOT IN (SELECT workshop_id FROM workshop_settings WHERE workshop_id IS NOT NULL)
ON CONFLICT (workshop_id) DO NOTHING;

-- 5. Insert default Moota settings untuk Bengkel Joko
INSERT INTO moota_settings (
    workshop_id, 
    moota_api_key, 
    bank_account_id, 
    webhook_secret,
    is_active
)
VALUES (
    'daaad89d-d695-4c53-b2b8-b1ac69355f26',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI1IiwianRpIjoiY2M4MWU4MDc3YWNjODJhYmE0ZWNhNGQ4Y2JmNGNhNGZkYjc4NzRkYjA1Yzg5ZmI5NmQxNmZiMTI1ZDVmNDgyZDdhZmRhNGM3NTdlOWQ2YzkiLCJpYXQiOjE3Mzc3MTQ0NDkuNDUzOTAyLCJuYmYiOjE3Mzc3MTQ0NDkuNDUzOTA0LCJleHAiOjQ4OTMzODgwNDkuNDQxMDY5LCJzdWIiOiJMWFJ5UHZkZ1RhcSIsInNjb3BlcyI6W119.lw7NlO7DqH2kMy4lDSZ9wKOqE23T1WbwxMD_jkgVBg2FfwB1cywJMGcSTkjO5e9-jfX0nMdGfODaOsF0gXRU-yF38S_xJ9gEK8t3HdlJZDqzeCnCv7nQIcnYwEGl-3UVvIVFIc77UGS1R7WB-r9w6BJgEqqVaQqDRDZNO3VYz-xSYCKvCyPzYXHQSaT5HrI-I0_MaBk1jHVPiqJNLKApFjb9bCH40s0BkZa8l7ZQ3CRb_x3fxlxMEwNOXI1aQK64Y7Rb9x_SCCW_VUzz9t8lePGlrI7HbkQxYmzYgOl-dFRYIb3EiZlJQVYZYkOQxQkG8zUYIbZYQ3lbZ',
    'KXajeZ74WGo',
    'mootasecret2026ABE',
    true
)
ON CONFLICT (workshop_id) 
DO UPDATE SET 
    moota_api_key = EXCLUDED.moota_api_key,
    bank_account_id = EXCLUDED.bank_account_id,
    webhook_secret = EXCLUDED.webhook_secret,
    updated_at = NOW();

-- ============================================
-- VERIFY:
-- ============================================

-- Cek workshop settings
SELECT 
    ws.workshop_id,
    w.name AS workshop_name,
    ws.booking_fee,
    ws.created_at
FROM workshop_settings ws
JOIN workshops w ON w.id = ws.workshop_id;

-- Cek moota settings
SELECT 
    ms.workshop_id,
    w.name AS workshop_name,
    ms.bank_account_id,
    ms.is_active,
    LEFT(ms.moota_api_key, 20) || '...' AS api_key_preview,
    ms.webhook_secret
FROM moota_settings ms
JOIN workshops w ON w.id = ms.workshop_id;

-- ============================================
-- NOTES:
-- ============================================

-- ✅ Tables created:
-- - workshop_settings: booking_fee per workshop
-- - moota_settings: Moota API config per workshop

-- ✅ Default values inserted:
-- - booking_fee: Rp 10.000
-- - Moota API key: (hardcoded dari mootaService.ts)
-- - Bank account: KXajeZ74WGo
-- - Webhook secret: mootasecret2026ABE

-- 📝 To update booking fee:
-- UPDATE workshop_settings 
-- SET booking_fee = 15000 
-- WHERE workshop_id = 'xxx';

-- 📝 To update Moota settings:
-- UPDATE moota_settings
-- SET moota_api_key = 'new_key',
--     bank_account_id = 'new_account'
-- WHERE workshop_id = 'xxx';
