/\*\*

- Webhook Moota - Testing Examples
-
- Copy-paste contoh ini untuk test webhook di development/production
-
- Requirements:
- - Server running: npm run start:server
- - .env configured with MOOTA_SECRET_TOKEN
- - Database migration run
    \*/

// =============================================================================
// 1. TEST ENDPOINT - Manual webhook trigger (development only)
// =============================================================================

/\*\*

- Test webhook processing dengan injecting manual booking
- Useful untuk test tanpa perlu transfer uang
-
- Endpoint: POST /api/webhook/moota/test
- Available: Development ONLY (NODE_ENV !== 'production')
  \*/

// Example 1: Test dengan booking code & amount
fetch('http://localhost:3001/api/webhook/moota/test', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
bookingCode: 'BK-1770272876477-dw3re8t6i',
amount: 10027
})
})
.then(r => r.json())
.then(console.log)

// Expected response:
// {
// "success": true,
// "message": "Test webhook processed",
// "paymentOrderId": "..."
// }

// =============================================================================
// 2. REAL WEBHOOK - Moota sends this (curl example)
// =============================================================================

/\*\*

- Production webhook dari Moota
- Server harus accessible via public URL (bukan localhost)
  \*/

// Step 1: Generate signature (Node.js)
const crypto = require('crypto');
const secretToken = process.env.MOOTA_SECRET_TOKEN;
const payload = {
bank_id: "629d6b39e3e9c80015bd8c3a",
account_id: "62a6cadd1c26df001550b86a",
mutations: [
{
mutation_id: "62b5f9a1e3e9c80015be0f1a",
reference: "BK-1770272876477-dw3re8t6i",
amount: 10027,
description: "Transfer dari Bambang",
type: "in",
created_at: new Date().toISOString(),
bank_id: "629d6b39e3e9c80015bd8c3a",
account_id: "62a6cadd1c26df001550b86a"
}
],
timestamp: new Date().toISOString()
};

const payloadString = JSON.stringify(payload);
const signature = crypto
.createHmac('sha256', secretToken)
.update(payloadString)
.digest('hex');

// Step 2: Send webhook
fetch('https://yourdomain.com/api/webhook/moota', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-Moota-Signature': signature
},
body: payloadString
})
.then(r => r.json())
.then(console.log)

// Expected response:
// {
// "success": true,
// "processed": 1,
// "message": "Successfully processed 1 mutation(s)"
// }

// =============================================================================
// 3. CURL EXAMPLES - Copy-paste ready
// =============================================================================

// Test endpoint (development)
// curl -X POST http://localhost:3001/api/webhook/moota/test \
// -H "Content-Type: application/json" \
// -d '{"bookingCode":"BK-1234567890-abc","amount":50000}'

// Health check
// curl http://localhost:3001/health

// =============================================================================
// 4. DATABASE VERIFICATION
// =============================================================================

/\*\*

- Run di Supabase SQL Editor untuk verify data
  \*/

-- Check payment_orders updated
SELECT id, order_id, total_amount, status, mutation_id, paid_at
FROM payment_orders
WHERE order_id = 'BK-1770272876477-dw3re8t6i'
ORDER BY created_at DESC
LIMIT 5;

-- Check booking updated
SELECT id, booking_code, status, customer_name, created_at
FROM bookings
WHERE booking_code = 'BK-1770272876477-dw3re8t6i';

-- Check all PAID orders today
SELECT
po.id,
po.order_id,
po.total_amount,
po.status,
po.paid_at,
b.customer_name
FROM payment_orders po
LEFT JOIN bookings b ON po.order_id = b.booking_code
WHERE po.status = 'PAID'
AND po.paid_at >= NOW() - INTERVAL '1 day'
ORDER BY po.paid_at DESC;

-- =============================================================================
// 5. FRONTEND TESTING
// =============================================================================

/\*\*

- Test customer flow di browser console
  \*/

// A. Check polling is detecting PAID status
// Open browser DevTools → Console
// Booking page saat payment verification
// Watch logs dengan keyword [MootaPayment]

// Expected logs:
// [MootaPayment] Starting polling for payment verification
// [MootaPayment] Polling check... Order ID: BK-xxx
// [MootaPayment] [Polling attempt #1] Status: CHECKING
// [MootaPayment] [Polling attempt #2] Status: CHECKING
// [MootaPayment] [Polling attempt #3] Status: PAID ← Webhook processed
// [MootaPayment] Polling detected PAID status!
// [MootaPayment] Calling onPaymentVerified callback
// → Auto-redirect ke Step 3

// B. Check payment order exists
console.table(
fetch('/api/payment-orders?bookingCode=BK-xxx')
.then(r => r.json())
)

// =============================================================================
// 6. SERVER LOGS VERIFICATION
// =============================================================================

/\*\*

- Check server console output untuk verify webhook processed
  \*/

// Expected logs saat webhook diterima:
// [Webhook] Received webhook from Moota
// [Webhook] Signature: hash...
// [Webhook] Secret token exists: true
// [Webhook] Verified signature. Processing mutations...
// [Webhook] Mutations count: 1
// [Webhook] Processing mutation: mutation_id
// [Webhook] Reference: BK-1770272876477-dw3re8t6i
// [Webhook] Amount: 10027
// [Webhook] Type: in
// [Webhook] Extracted booking code: BK-1770272876477-dw3re8t6i
// [Webhook] Found payment order: uuid
// [Webhook] Payment order updated to PAID: uuid
// [Webhook] Booking updated to CONFIRMED: BK-1770272876477-dw3re8t6i
// [Webhook] Processed mutations: 1

// =============================================================================
// 7. FULL TEST SCENARIO
// =============================================================================

/\*\*

- Complete test dari awal (tanpa transfer uang)
  \*/

// Step 1: Create booking dengan payment
// Visitor pergi ke GuestBooking
// Input name, phone, service, time
// Click "Lanjut" → Step 2

// Step 2: Choose payment method
// Pilih "Moota"
// Lihat rekening & amount untuk transfer
// Click "Saya Sudah Transfer"
// → payment_orders created dengan status CHECKING
// → polling starts

// Step 3 (Manual Verification):
// Admin go to /pending-payments
// Admin click "Verifikasi Transfer"
// → payment_orders.status = PAID (diupdate manual)
// → polling detect PAID
// → auto-redirect ke Step 3

// Step 3 (Webhook Verification):
// [AUTOMATIC] Moota robot detect mutation (15 min)
// [AUTOMATIC] POST /api/webhook/moota
// [AUTOMATIC] payment_orders.status = PAID
// → polling detect PAID (within 5 seconds)
// → auto-redirect ke Step 3

// Step 3: Input complaint & audio
// Input keluhan
// Record audio
// Click "Selesai"
// → Booking CONFIRMED
// → Redirect ke tracking

// =============================================================================
// 8. REAL TRANSFER TEST
// =============================================================================

/\*\*

- Test dengan transfer uang asli
  \*/

// 1. Buat booking dengan GuestBooking
// 2. Lihat amount (contoh: Rp 10,000)
// 3. Transfer dari HP ke rekening yang ditunjukkan
// 4. tunggu Moota robot (15 menit maksimal)
// 5. Webhook otomatis process
// 6. Lihat di browser: customer redirect otomatis
// 7. Verifikasi di database: payment_orders.status = PAID
// 8. Verify payment_orders.mutation_id terisi dengan ID dari Moota

// =============================================================================
// 9. STRESS TEST (Optional)
// =============================================================================

/\*\*

- Test multiple webhooks bersamaan (load testing)
  \*/

async function stressTest() {
const promises = [];

for (let i = 0; i < 10; i++) {
const payload = {
bookingCode: `BK-${Date.now()}-test${i}`,
amount: 10000 + (i \* 1000)
};

    promises.push(
      fetch('http://localhost:3001/api/webhook/moota/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json())
    );

}

const results = await Promise.all(promises);
console.log('Stress test results:', results);
}

// Run: stressTest()

// =============================================================================
// 10. MONITORING CHECKLIST
// =============================================================================

/\*\*

- Daily monitoring checklist
  \*/

// [ ] Server is running: curl http://server:3001/health
// [ ] Check logs for [Webhook] errors
// [ ] Count PAID orders: SELECT COUNT(_) FROM payment_orders WHERE status='PAID' AND paid_at > NOW() - INTERVAL '1 day'
// [ ] Check error rate: SELECT COUNT(_) FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour'
// [ ] Verify signatures: No "[Webhook] Invalid signature" errors
// [ ] Verify mutations parsed: All bookings found
// [ ] Database backups: Check backup logs
// [ ] Customer reports: Monitor complaints about payment

// =============================================================================
// 11. DEBUGGING TIPS
// =============================================================================

/\*\*

- Quick debugging untuk common issues
  \*/

// Issue: "Invalid signature"
// Debug:
// 1. Check .env MOOTA_SECRET_TOKEN exact value
// 2. Check Moota dashboard secret token (copy-paste exact)
// 3. Logs akan show: [Webhook] Invalid signature
// Fix: Update .env & restart server

// Issue: "Payment order not found"
// Debug:
// 1. Check booking code format: BK-timestamp-uuid
// 2. Check amount match
// 3. Logs akan show: [Webhook] Payment order not found
// 4. Query database: SELECT \* FROM payment_orders WHERE order_id='BK-xxx'
// Fix: Ensure booking dibuat sebelum transfer

// Issue: "Webhook not received"
// Debug:
// 1. Check webhook URL accessible: curl https://yourdomain.com/api/webhook/moota
// 2. Check firewall not blocking
// 3. Check server logs mencul entries
// 4. Moota dashboard → Test webhook → Manual trigger
// Fix: Check URL, check server, check firewall

// Issue: "Polling not detecting PAID"
// Debug:
// 1. Check browser console: [MootaPayment] logs
// 2. Check database: SELECT \* FROM payment_orders WHERE order_id='BK-xxx'
// 3. Check if status updated: PAID or CHECKING?
// Fix: Ensure webhook processed & database updated

// =============================================================================
// 12. PRODUCTION CHECKLIST
// =============================================================================

// Deploy checklist sebelum production:
// [ ] Server deployed & accessible via public URL
// [ ] .env MOOTA_SECRET_TOKEN configured
// [ ] NODE_ENV=production
// [ ] Database migration run
// [ ] SSL/HTTPS enabled
// [ ] Error monitoring setup (optional: Sentry)
// [ ] Logs collection setup (optional: DataDog)
// [ ] Database backup configured
// [ ] Team trained
// [ ] Manual verification fallback ready
// [ ] Test with real transfer
// [ ] Monitor first 24 hours closely

// =============================================================================

// Good luck! 🚀
