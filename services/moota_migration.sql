-- Migration: Add Moota payment integration tables
-- Run this in Supabase SQL Editor

-- ============================================
-- MOOTA SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moota_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    access_token TEXT NOT NULL,
    bank_account_id TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_type TEXT NOT NULL,
    secret_token TEXT NOT NULL,
    webhook_url TEXT,
    unique_code_start INTEGER DEFAULT 1,
    unique_code_end INTEGER DEFAULT 999,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for moota_settings
CREATE INDEX IF NOT EXISTS idx_moota_settings_is_active ON moota_settings (is_active);

CREATE INDEX IF NOT EXISTS idx_moota_settings_bank_account ON moota_settings (bank_account_id);

-- Enable RLS for moota_settings
ALTER TABLE moota_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
CREATE POLICY "Allow read access to moota_settings" ON moota_settings FOR
SELECT TO authenticated USING (true);

-- Policy: Allow write access to authenticated users (restrict to admin in production)
CREATE POLICY "Allow write access to moota_settings" ON moota_settings FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- ============================================
-- PAYMENT ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    unique_code INTEGER NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'CHECKING',
            'PAID',
            'EXPIRED',
            'CANCELLED'
        )
    ),
    bank_account_id TEXT NOT NULL,
    mutation_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

-- Create indexes for payment_orders
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders (status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_total_amount ON payment_orders (total_amount);

CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders (created_at);

CREATE INDEX IF NOT EXISTS idx_payment_orders_expires_at ON payment_orders (expires_at);

-- Enable RLS for payment_orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
CREATE POLICY "Allow read access to payment_orders" ON payment_orders FOR
SELECT TO authenticated USING (true);

-- Policy: Allow public read access for guest tracking
CREATE POLICY "Allow public read payment_orders" ON payment_orders FOR
SELECT TO anon USING (true);

-- Policy: Allow write access to authenticated users
CREATE POLICY "Allow write access to payment_orders" ON payment_orders FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- ============================================
-- WEBHOOK LOGS TABLE (for debugging)
-- ============================================
CREATE TABLE IF NOT EXISTS moota_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    signature TEXT,
    processed_orders TEXT[],
    errors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON moota_webhook_logs (created_at);

-- Enable RLS for webhook_logs
ALTER TABLE moota_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write access to authenticated users
CREATE POLICY "Allow access to webhook_logs" ON moota_webhook_logs FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger for moota_settings
DROP TRIGGER IF EXISTS update_moota_settings_updated_at ON moota_settings;

CREATE TRIGGER update_moota_settings_updated_at
    BEFORE UPDATE ON moota_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payment_orders
DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;

CREATE TRIGGER update_payment_orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-expire payment orders
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_payment_orders()
RETURNS void AS $$
BEGIN
    UPDATE payment_orders 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status IN ('PENDING', 'CHECKING') 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOB: Run expiry check periodically
-- Note: This requires pg_cron extension in Supabase
-- Run manually if pg_cron is not available
-- ============================================
-- SELECT cron.schedule('expire-payment-orders', '*/5 * * * *', 'SELECT expire_old_payment_orders()');

-- ============================================
-- VIEW: Payment orders with bank info
-- ============================================
CREATE OR REPLACE VIEW payment_orders_view AS
SELECT po.*, ms.bank_account_name, ms.bank_type, ms.account_number as bank_account_number
FROM
    payment_orders po
    LEFT JOIN moota_settings ms ON ms.bank_account_id = po.bank_account_id;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON
TABLE moota_settings IS 'Moota API configuration and bank account settings';

COMMENT ON
TABLE payment_orders IS 'Payment orders with unique codes for bank transfer matching';

COMMENT ON
TABLE moota_webhook_logs IS 'Logs of incoming webhooks from Moota for debugging';

COMMENT ON COLUMN payment_orders.unique_code IS 'Random code added to amount for payment matching';

COMMENT ON COLUMN payment_orders.total_amount IS 'Amount + unique_code that customer must transfer';