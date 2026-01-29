-- Migration: Add payment fields to bookings table
-- Run this in Supabase SQL Editor after the main schema

-- Add payment method column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (
    payment_method IN ('CASH', 'QRIS', 'TRANSFER')
);

-- Add transfer proof column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS transfer_proof_base64 TEXT;

-- Add payment amount column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0;

-- Update existing records to have default values
UPDATE bookings
SET
    payment_method = 'QRIS'
WHERE
    payment_method IS NULL;

UPDATE bookings
SET
    payment_amount = 25000
WHERE
    payment_amount IS NULL
    OR payment_amount = 0;