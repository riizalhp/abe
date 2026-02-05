-- ============================================
-- AUTO VERIFY PAYMENT - Database Function
-- Deploy via SQL Editor (NO CLI NEEDED!)
-- ============================================

-- 0. Add required columns if not exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS mutation_id VARCHAR(255);

ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_mutation_id ON payment_orders (mutation_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings (booking_code);

-- 1. Create function untuk auto-verify payment
CREATE OR REPLACE FUNCTION auto_verify_payment_on_update()
RETURNS TRIGGER AS $$
DECLARE
  current_booking_status VARCHAR(50);
BEGIN
  -- Jika status berubah menjadi PAID
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
    -- Cek status booking saat ini
    SELECT status INTO current_booking_status
    FROM bookings
    WHERE booking_code = NEW.order_id;
    
    -- Jika booking masih PENDING atau PENDING_REVIEW, update ke CONFIRMED
    -- Jika sudah CHECKED_IN atau status lain, biarkan (jangan override)
    IF current_booking_status IN ('PENDING', 'PENDING_REVIEW', 'PENDING_VERIFICATION') THEN
      UPDATE bookings
      SET 
        status = 'CONFIRMED',
        updated_at = NOW()
      WHERE booking_code = NEW.order_id;
      
      RAISE NOTICE 'Payment % verified, booking % updated to CONFIRMED', NEW.order_id, NEW.order_id;
    ELSE
      RAISE NOTICE 'Payment % verified, booking % status % preserved', NEW.order_id, NEW.order_id, current_booking_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger yang otomatis run function
DROP TRIGGER IF EXISTS trigger_auto_verify_payment ON payment_orders;

CREATE TRIGGER trigger_auto_verify_payment
AFTER UPDATE ON payment_orders
FOR EACH ROW
WHEN (NEW.status = 'PAID' AND OLD.status != 'PAID')
EXECUTE FUNCTION auto_verify_payment_on_update();

-- ============================================
-- CARA PAKAI:
-- ============================================

-- Option A: Admin verifikasi manual (klik button di /pending-payments)
-- Button akan UPDATE payment_orders SET status='PAID'
-- Trigger otomatis update bookings → CONFIRMED

-- Option B: Admin verifikasi via SQL langsung
-- UPDATE payment_orders
-- SET status = 'PAID', paid_at = NOW()
-- WHERE order_id = 'BK-XXX';
-- ↓
-- Trigger otomatis jalan → booking CONFIRMED

-- ============================================
-- TEST TRIGGER:
-- ============================================

-- Test 1: Update payment manual
UPDATE payment_orders
SET
    status = 'PAID',
    paid_at = NOW()
WHERE
    order_id = 'BK-1770279407886-egl2e2eh0';

-- Cek apakah booking auto-update
SELECT
    booking_code,
    status,
    customer_name,
    updated_at
FROM bookings
WHERE
    booking_code = 'BK-1770279407886-egl2e2eh0';

-- Expected result: status = 'CONFIRMED'

-- ============================================
-- MONITORING:
-- ============================================

-- Lihat semua payment yang perlu verifikasi
SELECT
    po.order_id,
    po.customer_name,
    po.total_amount,
    po.status AS payment_status,
    b.status AS booking_status,
    po.created_at
FROM payment_orders po
    LEFT JOIN bookings b ON b.booking_code = po.order_id
WHERE
    po.status = 'CHECKING'
ORDER BY po.created_at DESC;

-- Lihat payment yang sudah PAID tapi booking belum CONFIRMED (error case)
SELECT
    po.order_id,
    po.status AS payment_status,
    b.status AS booking_status,
    po.paid_at,
    b.updated_at
FROM payment_orders po
    LEFT JOIN bookings b ON b.booking_code = po.order_id
WHERE
    po.status = 'PAID'
    AND (
        b.status IS NULL
        OR b.status != 'CONFIRMED'
    );

-- ============================================
-- NOTES:
-- ============================================

-- ✅ KELEBIHAN:
-- - 100% SQL Editor, no CLI needed
-- - Auto-update booking saat payment PAID
-- - Work dengan manual verification button
-- - Work dengan SQL direct update

-- ❌ KETERBATASAN:
-- - Tidak bisa terima webhook dari Moota (butuh HTTP endpoint)
-- - Masih butuh admin klik verifikasi manual
-- - Atau admin run SQL UPDATE manual

-- 💡 UNTUK FULL AUTO (terima webhook Moota):
-- - Tetap butuh deploy edge function (CLI/Vercel)
-- - Atau pakai service external seperti Zapier, Make.com
-- - SQL function ini tetap jalan otomatis setelah webhook update payment