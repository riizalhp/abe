# Moota Webhook - Supabase Edge Functions

## 🚀 Setup Webhook dengan Supabase

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login ke Supabase

```bash
supabase login
```

### 3. Link ke Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Dapatkan `PROJECT_REF` dari:

- Supabase Dashboard → Settings → General → Reference ID

### 4. Set Environment Variables

Di Supabase Dashboard → Settings → Edge Functions → Secrets, tambahkan:

```bash
MOOTA_SECRET_TOKEN=your_webhook_secret_from_moota_dashboard
```

### 5. Deploy Edge Function

```bash
supabase functions deploy moota-callback --no-verify-jwt
```

**Note**: `--no-verify-jwt` diperlukan karena webhook Moota tidak mengirim JWT Supabase.

### 6. Get Webhook URL

Setelah deploy, URL webhook:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/moota-callback
```

---

## ⚙️ Setup di Moota Dashboard

### 1. Login ke Moota

Go to: https://app.moota.co

### 2. Setup Webhook

1. **Bank Account** → Pilih account → **Settings**
2. **Webhook Configuration**:
   - **Webhook URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/moota-callback`
   - **Secret Token**: Same value dari Supabase Secrets
   - **Events**: Mutations (Credit)
3. **Enable Robot**: 15 menit (0 Poin)
4. **Save**

---

## 🧪 Testing

### Test di Development (Local)

```bash
# Run function locally
supabase functions serve moota-callback --env-file .env.local
```

### Test dengan cURL

```bash
curl -X POST http://localhost:54321/functions/v1/moota-callback \
  -H "Content-Type: application/json" \
  -H "x-moota-signature: test" \
  -d '{
    "mutations": [{
      "mutation_id": "test123",
      "type": "CR",
      "amount": 10219,
      "description": "BK-1770272876477-dw3re8t6i Transfer dari customer"
    }]
  }'
```

### Test di Production

Moota Dashboard → Settings → Webhook → **Test Webhook**

---

## 📊 How It Works

```
Customer Transfer
    ↓
Moota Robot Detect (15 min, 0 Poin)
    ↓
POST /functions/v1/moota-callback
    ↓
Verify HMAC-SHA256 Signature
    ↓
Parse Mutation
    ↓
Extract Booking Code (BK-xxx-xxx)
    ↓
Find payment_orders (CHECKING)
    ↓
Update payment_orders → PAID
    ↓
Update bookings → CONFIRMED
    ↓
Customer Polling Detect (5 sec)
    ↓
Auto-Redirect to Step 3
```

---

## 🔐 Security

✅ HMAC-SHA256 signature verification  
✅ Secret token in Supabase Secrets (not in code)  
✅ Service Role Key for database access  
✅ Only CHECKING orders processed  
✅ Amount + booking code validation

---

## 📝 Database Migration

Jalankan SQL di Supabase SQL Editor:

```sql
-- Add webhook fields to payment_orders
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS mutation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_payment_orders_mutation_id
  ON payment_orders(mutation_id);

-- Add booking status if not exists
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_code
  ON bookings(booking_code);
```

---

## 🐛 Debugging

### Check Logs

Supabase Dashboard → Edge Functions → moota-callback → Logs

Look for:

```
[Webhook] Received request from Moota
[Webhook] Signature verified ✓
[Webhook] Processing mutations: 1
[Webhook] Extracted booking code: BK-xxx
[Webhook] Found payment order: uuid
[Webhook] ✓ Payment order updated to PAID
[Webhook] ✓ Booking updated to CONFIRMED
[Webhook] ✓ Processed mutations: 1
```

### Common Issues

**"Invalid signature"**

- Check MOOTA_SECRET_TOKEN di Supabase Secrets
- Verify exact match di Moota dashboard

**"Payment order not found"**

- Check booking code format (BK-timestamp-uuid)
- Check amount matches
- Check status = CHECKING (not PAID)

**"Function not found"**

- Run: `supabase functions deploy moota-callback --no-verify-jwt`
- Check deployment logs

---

## 📈 Monitoring

### View Function Logs

```bash
# Real-time logs
supabase functions logs moota-callback

# Follow logs
supabase functions logs moota-callback --follow
```

### View Function Stats

Supabase Dashboard → Edge Functions → moota-callback → Metrics:

- Invocations
- Errors
- Duration
- Success rate

---

## 🔄 Update Function

Jika ada perubahan code:

```bash
# Deploy updated function
supabase functions deploy moota-callback --no-verify-jwt

# Verify deployment
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/moota-callback
```

---

## 💰 Cost

**Supabase Edge Functions**:

- Free tier: 500,000 invocations/month
- Pro: 2,000,000 invocations/month

**Moota**:

- Robot 15 menit: 0 Poin (FREE)
- Webhook: 0 Poin (FREE)

**Total**: FREE ✅

---

## ✅ Checklist Deployment

- [ ] Supabase CLI installed
- [ ] Linked to project
- [ ] MOOTA_SECRET_TOKEN set
- [ ] Database migration run
- [ ] Function deployed
- [ ] Webhook URL configured di Moota
- [ ] Robot enabled (15 min)
- [ ] Test webhook successful
- [ ] Logs verified
- [ ] Customer flow tested

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Moota API**: https://moota.co/developer
- **Function Code**: `supabase/functions/moota-callback/index.ts`

---

**Status**: ✅ Production Ready  
**Last Updated**: February 5, 2026
