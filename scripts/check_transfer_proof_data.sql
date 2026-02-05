-- Check if transfer_proof_base64 column exists and has data
-- Run this in Supabase SQL Editor to verify

-- 1. Check if column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name = 'transfer_proof_base64';

-- 2. Check recent bookings with transfer proof
SELECT 
    id,
    booking_code,
    customer_name,
    created_at,
    CASE 
        WHEN transfer_proof_base64 IS NULL THEN 'NULL'
        WHEN transfer_proof_base64 = '' THEN 'EMPTY STRING'
        ELSE CONCAT('HAS DATA (', LENGTH(transfer_proof_base64), ' chars)')
    END as proof_status
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count bookings with transfer proof
SELECT 
    COUNT(*) as total_bookings,
    COUNT(transfer_proof_base64) as bookings_with_proof,
    COUNT(CASE WHEN transfer_proof_base64 IS NOT NULL AND transfer_proof_base64 != '' THEN 1 END) as bookings_with_actual_data
FROM bookings;
