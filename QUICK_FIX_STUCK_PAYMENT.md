# 🚨 Quick Fix: Payment Stuck "Menunggu Verifikasi"

## Masalah

Customer stuck di "Menunggu Verifikasi" padahal transfer sudah SUCCESS di Moota.

## Penyebab

- Webhook belum aktif (tidak auto-verify)
- Admin belum klik verifikasi manual

## ✅ Solusi Cepat (SEKARANG)

### 1. Verifikasi Manual

Buka browser admin:

```
http://localhost:9000/pending-payments
```

Atau:

```
http://localhost:9001/pending-payments
```

### 2. Klik "Verifikasi Transfer"

- Cari payment dengan booking code: **BK-1770279407886-egl2e2eh0**
- Nominal: **Rp 10.430**
- Customer: **QQ**
- Klik tombol **"Verifikasi Transfer"**

### 3. Customer Auto-Redirect

Dalam 5 detik, customer otomatis pindah ke step 3 (input keluhan)!

---

## 🤖 Solusi Permanen: Deploy Webhook

Supaya tidak perlu verifikasi manual lagi:

### Install Supabase CLI

```powershell
npm install -g supabase
```

### Deploy Webhook

```powershell
# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Set secret di Dashboard Supabase: Settings > Edge Functions > Secrets
# Add: MOOTA_SECRET_TOKEN = your_secret_token

# Deploy
supabase functions deploy moota-callback --no-verify-jwt
```

### Konfigurasi Moota

1. Buka: https://app.moota.co/settings
2. Set **Webhook URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/moota-callback`
3. Set **Secret Token**: (token yang sama dengan MOOTA_SECRET_TOKEN)
4. Set **Robot Interval**: 15 menit
5. Test webhook dengan transfer kecil (Rp 1.000)

---

## 📊 Status Saat Ini

**Current Payment:**

- Order ID: BK-1770279407886-egl2e2eh0
- Amount: Rp 10.430
- Status Moota: ✅ SUCCESS
- Status Database: ⏳ CHECKING (butuh verifikasi)

**Webhook Status:**

- ❌ Belum di-deploy
- Manual verification: ✅ Masih berfungsi

---

## Cara Cek Payment Orders

Buka Supabase Dashboard > SQL Editor:

```sql
-- Cek payment yang stuck
SELECT
  order_id,
  customer_name,
  total_amount,
  status,
  created_at
FROM payment_orders
WHERE status = 'CHECKING'
ORDER BY created_at DESC;

-- Verifikasi manual via SQL (emergency)
UPDATE payment_orders
SET
  status = 'PAID',
  paid_at = NOW()
WHERE order_id = 'BK-1770279407886-egl2e2eh0';

-- Update booking status
UPDATE bookings
SET status = 'CONFIRMED'
WHERE booking_code = 'BK-1770279407886-egl2e2eh0';
```

Setelah run SQL, refresh browser customer - langsung redirect!
