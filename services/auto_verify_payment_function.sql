-- ============================================
-- AUTO VERIFY PAYMENT - Database Function
-- Deploy via SQL Editor (NO CLI NEEDED!)
-- ============================================

-- 1. Create function untuk auto-verify payment
CREATE OR REPLACE FUNCTION auto_verify_payment_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika status berubah menjadi PAID
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
    -- Update booking status menjadi CONFIRMED
    UPDATE bookings
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE booking_code = NEW.order_id;
    
    RAISE NOTICE 'Payment % verified, booking % confirmed', NEW.order_id, NEW.order_id;
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