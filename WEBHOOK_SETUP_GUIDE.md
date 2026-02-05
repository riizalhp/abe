# Webhook Moota - Auto Payment Verification

## 📋 Overview

Webhook Moota memungkinkan sistem otomatis **auto-verify** payment ketika customer transfer uang. Tidak perlu manual klik button "Verifikasi Transfer" di admin panel.

### Keuntungan:

- ✅ **FREE** - Tidak pakai poin Moota (0 poin)
- ✅ **Auto** - Verifikasi otomatis setiap 15 menit robot Moota
- ✅ **Real-time** - Customer langsung dinotifikasi (polling 5 detik)
- ✅ **Secure** - HMAC-SHA256 signature verification

### Biaya:

- **Moota**: 0 Poin (pakai robot 15 menit)
- **Infrastructure**: Butuh server untuk webhook endpoint
- **Deployment**: Vercel, Railway, Heroku, Digital Ocean, AWS, etc.

---

## 🚀 Setup Webhook

### Step 1: Setup Environment Variables

Tambah ke `.env`:

```env
MOOTA_SECRET_TOKEN=your_webhook_secret_from_moota_dashboard
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Step 2: Deploy Server

Server ini berjalan di `3001` dan menerima webhook dari Moota.

#### Option A: Vercel (Recommended for free tier)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Create `vercel.json` di root (sudah ada):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

3. Deploy:

```bash
vercel --prod
```

4. Vercel akan kasih URL seperti: `https://abe-bengkel.vercel.app`

5. Update MOOTA_SECRET_TOKEN di Vercel dashboard → Settings → Environment Variables

#### Option B: Railway (Recommended)

1. Push ke GitHub
2. Go ke railway.app
3. Deploy from GitHub
4. Add environment variables di Railway dashboard
5. Railway kasih URL otomatis

#### Option C: Docker + Own Server

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start:server:prod"]
```

### Step 3: Setup Webhook di Moota Dashboard

1. **Login ke Moota**: app.moota.co
2. **Go to**: Bank Accounts → Your Account → Settings
3. **Enable Robot**:
   - Robot Mode: ON
   - Check Interval: **15 menit** (0 Poin per check)
4. **Webhook Settings**:
   - Webhook URL: `https://yourdomain.com/api/webhook/moota`
   - Webhook Type: Mutations
   - Secret Token: Buat password random, copas ke `.env` MOOTA_SECRET_TOKEN

**Moota Dashboard Path:**

```
app.moota.co
  → Akun Bank (left menu)
  → Select your account
  → ⚙️ Settings
  → Webhook Configuration
```

### Step 4: Test Webhook

#### Test di Vercel/Server (Development)

Make POST request:

```bash
curl -X POST http://localhost:3001/api/webhook/moota/test \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCode": "BK-1770272876477-dw3re8t6i",
    "amount": 10027
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Test webhook processed",
  "paymentOrderId": "..."
}
```

#### Production Test

Minta Moota untuk send test webhook via dashboard, atau:

1. Make transfer sesuai dengan booking amount
2. Wait max 15 menit
3. Check logs di server
4. Payment order auto-update ke PAID
5. Customer polling detect PAID

---

## 🔄 Flow Diagram

```
Customer Transfer
    ↓
Moota detect (15 menit)
    ↓
POST /api/webhook/moota
    ↓
Verify signature (HMAC-SHA256)
    ↓
Parse mutation data
    ↓
Extract booking code dari reference
    ↓
Find payment_orders (CHECKING status)
    ↓
Update payment_orders → PAID
    ↓
Update booking → CONFIRMED
    ↓
Customer polling detect PAID (5 detik)
    ↓
Auto-redirect ke step 3 (complaint input)
```

---

## 🛠️ Implementation Details

### Database Requirements

**payment_orders table needs:**

```sql
- id (UUID primary key)
- order_id (booking code) ✅
- total_amount ✅
- bank_account_id ✅
- status (CHECKING → PAID) ✅
- mutation_id (optional, store Moota mutation_id)
- paid_at (timestamp)
```

**bookings table needs:**

```sql
- booking_code ✅
- status (PENDING_VERIFICATION → CONFIRMED) ✅
```

### Reference Format (untuk parsing)

Customer harus transfer dengan keterangan (reference) format:

```
BK-{timestamp}-{uniqueId} atau
BK-1770272876477-dw3re8t6i (contoh)
```

Webhook parser extract dari reference ini untuk find corresponding booking.

### Signature Verification

Moota kirim `X-Moota-Signature` header dengan HMAC-SHA256:

```typescript
const expectedSignature = crypto
  .createHmac("sha256", MOOTA_SECRET_TOKEN)
  .update(rawBody)
  .digest("hex");

if (signature !== expectedSignature) {
  // Reject webhook - invalid signature
}
```

---

## 📊 Payment Status Flow

```
Step 1: Customer Input Booking Details
  ↓
Step 2: Customer Click "Sudah Transfer"
  → payment_orders.status = CHECKING
  → polling starts (5 detik)
  ↓
[Option A] Manual Verification (Current)
  → Admin click "Verifikasi Transfer"
  → payment_orders.status = PAID
  ↓
[Option B] Webhook Verification (New)
  → Customer transfer uang
  → Moota detect (15 min)
  → Webhook POST /api/webhook/moota
  → payment_orders.status = PAID
  ↓
Polling detect PAID
  ↓
Customer auto-redirect ke Step 3
  ↓
Step 3: Input complaint & audio
  ↓
Booking CONFIRMED
  ↓
Redirect ke tracking page
```

---

## 🔐 Security Checklist

- ✅ Verify webhook signature (HMAC-SHA256)
- ✅ Only process incoming mutations (type === 'in')
- ✅ Only process CHECKING orders (not PAID)
- ✅ Match booking code + amount + bank account
- ✅ Use environment variables for secrets
- ✅ HTTPS only in production
- ✅ CORS enabled for frontend
- ✅ Error logging untuk debugging

---

## 🐛 Debugging

### Check Webhook Logs

Server logs will show:

```
[Webhook] Received webhook from Moota
[Webhook] Verified signature
[Webhook] Processing mutations...
[Webhook] Extracted booking code: BK-1770272876477-dw3re8t6i
[Webhook] Found payment order: uuid
[Webhook] Payment order updated to PAID: uuid
[Webhook] Booking updated to CONFIRMED: BK-xxx
[Webhook] Processed mutations: 1
```

### Common Issues

1. **"Invalid signature"**
   - ❌ MOOTA_SECRET_TOKEN salah di .env
   - ❌ Secret tidak match di Moota dashboard
   - ✅ Check exact string match (no quotes, no spaces)

2. **"Payment order not found"**
   - ❌ Booking code format salah (harus BK-xxx-xxx)
   - ❌ Amount tidak sesuai
   - ❌ Order status bukan CHECKING (sudah PAID)
   - ✅ Verify di database bahwa payment_orders ada

3. **Webhook tidak diterima**
   - ❌ Webhook URL salah di Moota
   - ❌ Server down/not listening
   - ❌ Firewall blocking
   - ✅ Check server logs, verify URL accessible

### Test Manually

Di terminal:

```bash
# Simulate Moota webhook (test endpoint only)
curl -X POST http://localhost:3001/api/webhook/moota/test \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCode": "BK-1234567890-abc",
    "amount": 50000
  }'
```

---

## 🚀 Migration dari Manual ke Webhook

### Existing Bookings dengan Manual Verification

Tidak ada perubahan code diperlukan. Sistem support keduanya:

1. **Customer lama (manual)**: Admin tetap bisa klik "Verifikasi Transfer" button
2. **Customer baru (webhook)**: Auto-verify via webhook

### Disable Manual Verification (Optional)

Jika ingin disable admin button, edit `src/pages/PendingPayments.tsx`:

```typescript
// Hide manual verification section
<div style={{ display: 'none' }}>
  {/* Manual verification UI */}
</div>
```

---

## 📱 Customer Experience (Webhook)

1. Customer see booking form (Step 1)
2. Customer input details & next
3. Customer input payment method (Step 2)
   - Choose Moota, input account
   - Click "Sudah Transfer"
   - See waiting screen with "Menunggu Verifikasi..."
4. Customer make transfer (IRL - via mobile banking)
5. **[AUTOMATIC]** Moota detect & webhook process
   - No admin action needed!
6. Polling detect PAID within 5 seconds
7. Customer auto-redirect ke Step 3
8. Customer input complaint & record audio
9. Click "Selesai"
10. Redirect ke tracking page

---

## 📈 Production Checklist

- [ ] Server deployed & running
- [ ] Webhook URL configured di Moota
- [ ] Secret token configured (.env)
- [ ] Database schema verified
- [ ] Test webhook processed successfully
- [ ] Logs are being recorded
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Error monitoring setup (optional: Sentry, DataDog)
- [ ] Database backups configured

---

## 💡 Alternative: Polling Moota API (Not Recommended)

Jika webhook tidak bisa disetup, bisa pakai API polling:

```typescript
// Every 5 seconds, check payment status via API
const checkPaymentStatus = async (orderId: string) => {
  const response = await fetch(
    `https://app.moota.co/api/v2/histories?reference=${orderId}`,
    {
      headers: { Authorization: `Bearer ${MOOTA_API_KEY}` },
    },
  );
  // Cost: 1 poin per request
};
```

**TAPI**:

- ❌ Costs 1 poin per request
- ❌ Slower (depends on polling interval)
- ❌ Higher API usage

**Tidak recommend untuk production** - pakai webhook aja.

---

## 📞 Support

Jika ada error atau timeout di webhook:

1. Check server logs: `console.log` entries dengan `[Webhook]` prefix
2. Verify di database: `payment_orders.status` harus PAID
3. Check browser console: `[MootaPayment]` logs
4. Verify Moota dashboard: Check if mutation detected

Debug endpoint (development only):

```
POST http://localhost:3001/api/webhook/moota/test
```

Production: Ask Moota support untuk resend webhook dari dashboard.
