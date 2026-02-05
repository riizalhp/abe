-- Add transfer_proof_base64 column to bookings table
-- Used to store base64 encoded image of payment proof (manual/QRIS)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS transfer_proof_base64 TEXT;

-- Comment for clarity
COMMENT ON COLUMN bookings.transfer_proof_base64 IS 'Base64 encoded string of payment proof image (for QRIS/Manual)';
