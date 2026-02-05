# 🎉 Webhook Moota - Supabase Edge Functions

## ✅ Sudah Siap Digunakan!

Sistem webhook sekarang menggunakan **Supabase Edge Functions** - sama seperti di `MOOTA_IMPLEMENTATION_GUIDE.md`.

---

## 📦 Yang Sudah Dibuat

### 1. Supabase Edge Function

```
✅ supabase/functions/moota-callback/index.ts
   - Webhook handler dengan Deno/TypeScript
   - HMAC-SHA256 signature verification
   - Auto-update payment_orders → PAID
   - Auto-update bookings → CONFIRMED
```

### 2. Configuration

```
✅ supabase/config.toml
   - verify_jwt = false untuk webhook
```

### 3. Documentation

```
✅ SUPABASE_WEBHOOK_SETUP.md
   - Complete setup guide
   - Deploy instructions
   - Testing guide
   - Debugging tips
```

### 4. Component Update

```
✅ src/components/MootaPayment.tsx
   - Updated comments untuk Supabase webhook
   - Polling tetap jalan (detect PAID status)
```

---

## 🚀 Quick Setup (5 Langkah)

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login & Link

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set Secret

Di Supabase Dashboard → Settings → Edge Functions → Secrets:

```
MOOTA_SECRET_TOKEN=your_secret_from_moota
```

### 4. Deploy Function

```bash
supabase functions deploy moota-callback --no-verify-jwt
```

### 5. Setup Moota Webhook

Di Moota Dashboard → Settings → Webhook:

- **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback`
- **Secret**: Same dari Supabase Secrets
- **Robot**: Enable 15 menit

---

## 🔄 How It Works

```
Customer Transfer
    ↓
Moota Robot (15 min, FREE)
    ↓
POST https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback
    ↓
Supabase Edge Function:
  1. Verify signature
  2. Parse mutation
  3. Find payment_orders
  4. Update → PAID
  5. Update booking → CONFIRMED
    ↓
Customer Polling (5 sec)
    ↓
Auto-Redirect Step 3 🎉
```

---

## 💡 Keuntungan Supabase Edge Functions

✅ **Terintegrasi** - Langsung dengan Supabase database  
✅ **Gratis** - 500K invocations/month  
✅ **Cepat** - Deploy dalam hitungan detik  
✅ **Auto-scale** - Handled by Supabase  
✅ **Logs Built-in** - Monitoring langsung di dashboard  
✅ **No Server Management** - Serverless architecture

---

## 🆚 Perbedaan dengan Express.js Version

| Aspek        | Supabase Edge Function ✅   | Express.js Server        |
| ------------ | --------------------------- | ------------------------ |
| **Deploy**   | `supabase functions deploy` | Deploy ke Vercel/Railway |
| **Runtime**  | Deno (TypeScript)           | Node.js                  |
| **Server**   | Serverless (auto-managed)   | Perlu manage server      |
| **Cost**     | FREE (500K/month)           | Depends on platform      |
| **Setup**    | Simple (1 command)          | Multiple steps           |
| **Logs**     | Built-in dashboard          | Need external service    |
| **Database** | Direct Supabase client      | Same                     |

**Recommendation**: **Supabase Edge Functions** lebih mudah & terintegrasi! ✅

---

## 📋 Database Migration

Jalankan di Supabase SQL Editor:

```sql
-- Add webhook fields
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS mutation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_mutation_id
  ON payment_orders(mutation_id);

-- Add booking status
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_code
  ON bookings(booking_code);
```

---

## 🧪 Testing

### Test Locally

```bash
# Run function locally
supabase functions serve moota-callback

# Test with curl
curl -X POST http://localhost:54321/functions/v1/moota-callback \
  -H "Content-Type: application/json" \
  -d '{"mutations":[{"type":"CR","amount":10219,"description":"BK-test-123"}]}'
```

### Test Production

1. Moota Dashboard → Settings → Webhook
2. Click "Test Webhook"
3. Check logs di Supabase Dashboard

---

## 🐛 Debugging

### View Logs

```bash
# CLI
supabase functions logs moota-callback --follow

# Dashboard
Supabase → Edge Functions → moota-callback → Logs
```

### Expected Logs

```
[Webhook] Received request from Moota
[Webhook] Signature verified ✓
[Webhook] Processing mutations: 1
[Webhook] Extracted booking code: BK-xxx
[Webhook] Found payment order: uuid
[Webhook] ✓ Payment order updated to PAID
[Webhook] ✓ Booking updated to CONFIRMED
```

---

## 💰 Cost

**Supabase**:

- Edge Functions: FREE (500K invocations/month)
- Database: FREE tier available

**Moota**:

- Robot 15 min: 0 Poin
- Webhook: 0 Poin

**Total**: **FREE** ✅

---

## 📞 Next Steps

1. **Read**: [SUPABASE_WEBHOOK_SETUP.md](SUPABASE_WEBHOOK_SETUP.md) (complete guide)
2. **Deploy**: Follow 5 langkah di atas
3. **Test**: Transfer kecil untuk test (Rp 1,000)
4. **Monitor**: Check logs di Supabase Dashboard
5. **Go Live**: Enable untuk production! 🚀

---

## 📚 Documentation Files

| File                                         | Purpose                           |
| -------------------------------------------- | --------------------------------- |
| `SUPABASE_WEBHOOK_SETUP.md`                  | Complete setup & deployment guide |
| `supabase/functions/moota-callback/index.ts` | Edge function code                |
| `supabase/config.toml`                       | Supabase configuration            |
| `services/webhook_migration.sql`             | Database migration                |

---

## ✨ Status

- ✅ Edge Function Created
- ✅ Configuration Ready
- ✅ Documentation Complete
- ✅ Migration Script Ready
- ⏭️ Ready to Deploy!

---

**Sekarang tinggal deploy ke Supabase!** 🚀

Follow guide lengkap di: [SUPABASE_WEBHOOK_SETUP.md](SUPABASE_WEBHOOK_SETUP.md)
