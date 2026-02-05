# ✅ Webhook Deployment - DONE!

## 🎉 Code sudah di-push ke GitHub!

Repository: https://github.com/riizalhp/abe
Commit: `e8dcbad` - Add Moota webhook auto-verification (Vercel serverless)

---

## 🚀 Langkah Selanjutnya

### 1. Vercel Auto-Deploy

Vercel akan **otomatis deploy** dalam 1-2 menit!

**Cek status:**

1. Buka: https://vercel.com/riizalhps-projects
2. Pilih project `bengkel-kangacep`
3. Tab **Deployments** → Lihat latest deployment
4. Tunggu status: ✅ **Ready**

---

### 2. Set Environment Variables di Vercel

**PENTING! Webhook tidak akan jalan tanpa ini.**

1. Buka: https://vercel.com/riizalhps-projects/bengkel-kangacep/settings/environment-variables

2. **Add 3 variables:**

| Name                        | Value                                      | Where to get                                                         |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `MOOTA_SECRET_TOKEN`        | `your_secret_token`                        | Pilih token rahasia sendiri (misal: `moota_secret_2026_ABE`)         |
| `SUPABASE_URL`              | `https://irswqjmooxsrpoyndghf.supabase.co` | From Supabase Dashboard → Settings → API → Project URL               |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  | From Supabase Dashboard → Settings → API → **service_role (secret)** |

3. **Save** semua variables

4. **Redeploy:**
   - Tab **Deployments**
   - Klik titik 3 di deployment terakhir
   - Pilih **Redeploy**
   - Tunggu build selesai

---

### 3. Configure Moota Webhook

1. Buka: https://app.moota.co/settings

2. Cari section **Webhook** atau **Callback URL**

3. **Set URL webhook:**

   ```
   https://bengkel-kangacep.vercel.app/api/moota-callback
   ```

4. **Set Secret Token:** (harus sama dengan `MOOTA_SECRET_TOKEN` di Vercel)

   ```
   moota_secret_2026_ABE
   ```

   _(atau token lain yang Anda pilih)_

5. **Method:** POST

6. **Aktifkan** webhook (toggle ON)

7. **Set Robot Interval:** 15 menit (free, 0 poin)

8. **Save** settings

---

### 4. Test Webhook

#### Test 1: Via Moota Dashboard

1. Di halaman webhook settings, klik **Test Webhook**
2. Moota akan kirim dummy request
3. Cek response harus: `{"success":true}`

#### Test 2: Via Terminal

```powershell
curl -X POST https://bengkel-kangacep.vercel.app/api/moota-callback
```

Response harus: `{"error":"Method not allowed"}` (signature validation gagal, tapi endpoint aktif!)

#### Test 3: Transfer Real

1. Customer buat booking baru
2. Customer transfer exact amount + unique code
3. Tunggu max 15 menit
4. Cek Vercel logs: https://vercel.com/riizalhps-projects/bengkel-kangacep/logs
5. Customer harus **auto-redirect** ke step 3!

---

### 5. Run Database Migration (WAJIB!)

Buka Supabase Dashboard → SQL Editor, run:

```sql
-- Add mutation_id and paid_at columns
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS mutation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add booking status
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_mutation_id ON payment_orders(mutation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);

-- Create auto-verify trigger
CREATE OR REPLACE FUNCTION auto_verify_payment_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
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

DROP TRIGGER IF EXISTS trigger_auto_verify_payment ON payment_orders;

CREATE TRIGGER trigger_auto_verify_payment
AFTER UPDATE ON payment_orders
FOR EACH ROW
WHEN (NEW.status = 'PAID' AND OLD.status != 'PAID')
EXECUTE FUNCTION auto_verify_payment_on_update();
```

---

## ✅ Checklist

- [x] Code pushed ke GitHub
- [ ] Vercel auto-deploy selesai (cek status Ready)
- [ ] Environment variables set di Vercel (3 variables)
- [ ] Redeploy setelah set env vars
- [ ] Database migration run di Supabase SQL Editor
- [ ] Webhook URL configured di Moota
- [ ] Secret token match Moota ↔ Vercel
- [ ] Robot interval set 15 menit
- [ ] Test webhook sukses (Moota test button)
- [ ] Test transfer real berhasil

---

## 📊 Monitoring

### Cek Webhook Logs

**Vercel Logs:**
https://vercel.com/riizalhps-projects/bengkel-kangacep/logs

**Filter:** Function `api/moota-callback.ts`

**Log yang sehat:**

```
[Moota Webhook] Received request
[Moota Webhook] Signature verified
[Moota Webhook] Processing 1 mutations
[Moota Webhook] Found booking code: BK-XXX, amount: 10430
[Moota Webhook] Amount verified for BK-XXX
[Moota Webhook] Payment BK-XXX marked as PAID
[Moota Webhook] Booking BK-XXX confirmed! ✅
[Moota Webhook] Completed: 1 processed, 0 errors
```

### Cek Database

```sql
-- Payment yang auto-verified hari ini
SELECT
  order_id,
  customer_name,
  total_amount,
  status,
  mutation_id,
  paid_at,
  created_at
FROM payment_orders
WHERE
  status = 'PAID'
  AND paid_at::date = CURRENT_DATE
ORDER BY paid_at DESC;

-- Booking yang auto-confirmed
SELECT
  booking_code,
  customer_name,
  status,
  updated_at
FROM bookings
WHERE
  status = 'CONFIRMED'
  AND updated_at::date = CURRENT_DATE
ORDER BY updated_at DESC;
```

---

## 🔧 Troubleshooting

### Vercel deployment failed?

- Check build logs di Vercel dashboard
- Mungkin butuh install dependencies: `npm install @vercel/node @supabase/supabase-js crypto`

### Webhook return 500 error?

- Env variables belum di-set atau salah
- Cek Vercel logs untuk detail error

### Moota test webhook gagal?

- URL salah (harus HTTPS, harus `/api/moota-callback`)
- Secret token tidak match
- Vercel function belum ready (tunggu deploy selesai)

### Transfer tidak auto-verify?

- Webhook belum configured di Moota
- Robot interval belum di-set
- Nominal transfer tidak exact (harus amount + unique code)
- Check Vercel logs untuk lihat apakah request masuk

---

## 🎯 Expected Result

**Customer Experience:**

1. Input data → Step 1
2. Klik "Sudah Transfer" → Step 2 (Menunggu Verifikasi)
3. Transfer ke rekening
4. Tunggu **max 15 menit**
5. **Otomatis redirect** ke Step 3 (Input Keluhan)
6. Done! ✅

**Admin Experience:**

- **TIDAK PERLU CEK MOOTA**
- **TIDAK PERLU KLIK VERIFIKASI**
- Semua otomatis! 🎉

---

## 🆘 Need Help?

**Issues with deployment?**
Reply dengan screenshot Vercel deployment logs

**Webhook tidak jalan?**
Share Vercel function logs (filter: moota-callback)

**Database errors?**
Check Supabase logs dan RLS policies

---

**Webhook URL Final:**

```
https://bengkel-kangacep.vercel.app/api/moota-callback
```

**Next:** Set env variables di Vercel, lalu test! 🚀
