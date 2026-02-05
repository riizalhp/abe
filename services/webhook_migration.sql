/**
 * Webhook Migration
 * 
 * Run this migration untuk menambah field yang dibutuhkan webhook:
 * - mutation_id: Store Moota mutation ID untuk reference
 * - paid_at: Timestamp kapan payment dikonfirmasi
 * 
 * Jalankan via Supabase dashboard:
 * SQL Editor → New Query → Paste ini → Run
 */

-- Tambah field ke payment_orders table
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS mutation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add index untuk faster lookup
CREATE INDEX IF NOT EXISTS idx_payment_orders_mutation_id ON payment_orders (mutation_id);

-- Update booking status dari PENDING_VERIFICATION ke CONFIRMED via webhook
-- Pastikan bookings table punya status column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

-- Create index untuk faster status lookup
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Create index untuk faster booking_code lookup
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings (booking_code);

-- Verify tables
SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'payment_orders'
    AND column_name IN ('mutation_id', 'paid_at');

SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'bookings'
    AND column_name = 'status';