# 🚀 Deploy Webhook ke Vercel (FULL OTOMATIS, NO CLI!)

## ✅ Ini FULL AUTO - Zero Admin Needed!

**Flow setelah deploy:**

```
Customer transfer ke rekening
    ↓
Moota robot detect (15 menit) ← OTOMATIS
    ↓
Moota POST webhook ← OTOMATIS
    ↓
Vercel function terima request ← OTOMATIS
    ↓
Update payment_orders → PAID ← OTOMATIS
    ↓
Update bookings → CONFIRMED ← OTOMATIS
    ↓
Customer auto-redirect ke step 3 ← OTOMATIS
```

**Admin tidak perlu klik apa-apa! Semua jalan sendiri!**

---

## 📋 Setup (15 Menit, Via Browser)

### 1. Buat GitHub Repository

1. Buka https://github.com/new
2. Repository name: `abe-webhook`
3. Pilih **Private**
4. Klik **Create repository**

### 2. Upload Code ke GitHub

Buka terminal di folder project:

```powershell
# Initialize git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Add Moota webhook for Vercel"

# Connect ke GitHub (ganti YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/abe-webhook.git

# Push
git branch -M main
git push -u origin main
```

### 3. Deploy ke Vercel

1. Buka https://vercel.com/signup
2. **Continue with GitHub**
3. Klik **Import Project**
4. Pilih repository `abe-webhook`
5. Klik **Import**

### 4. Set Environment Variables di Vercel

Di Vercel dashboard → **Settings** → **Environment Variables**, tambahkan:

| Name                        | Value                                      |
| --------------------------- | ------------------------------------------ |
| `MOOTA_SECRET_TOKEN`        | `your_moota_secret_token_here`             |
| `SUPABASE_URL`              | `https://irswqjmooxsrpoyndghf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key_here`               |

**Cara dapat Service Role Key:**

- Buka Supabase Dashboard
- Settings → API
- Copy **service_role (secret)**

**Simpan semua variables**, lalu klik **Redeploy**.

### 5. Konfigurasi Moota Webhook

1. Buka https://app.moota.co/settings
2. Cari bagian **Webhook**
3. **Webhook URL**: `https://your-project.vercel.app/api/moota-callback`
   - Ganti `your-project` dengan nama project Vercel Anda
   - Cek di Vercel dashboard → **Domains**
4. **Secret Token**: (sama dengan `MOOTA_SECRET_TOKEN` yang Anda set di Vercel)
5. **Method**: POST
6. **Aktifkan** webhook
7. Set **Robot Interval**: 15 menit (gratis, 0 poin)

### 6. Test Webhook

**Test via Moota Dashboard:**

1. Di halaman webhook settings, klik **Test Webhook**
2. Moota akan kirim dummy request
3. Cek Vercel logs: Dashboard → **Functions** → `moota-callback` → **Logs**
4. Harus muncul log: `[Moota Webhook] Received request`

**Test dengan transfer real:**

1. Customer booking → step 2 payment
2. Transfer amount + unique code ke rekening Moota
3. Tunggu **max 15 menit** (sesuai robot interval)
4. Customer **otomatis redirect** ke step 3!

---

## 📊 Monitoring

### Cek Logs Vercel

1. Buka Vercel Dashboard
2. Pilih project
3. **Functions** → `moota-callback`
4. Klik **Logs** atau **Real-time**
5. Lihat semua webhook request masuk

**Log Success:**

```
[Moota Webhook] Received request
[Moota Webhook] Signature verified
[Moota Webhook] Found booking code: BK-XXX, amount: 10430
[Moota Webhook] Amount verified for BK-XXX
[Moota Webhook] Payment BK-XXX marked as PAID
[Moota Webhook] Booking BK-XXX confirmed! ✅
[Moota Webhook] Completed: 1 processed, 0 errors
```

### Cek Database

```sql
-- Lihat payment yang auto-verified
SELECT
  order_id,
  status,
  mutation_id,
  paid_at,
  created_at
FROM payment_orders
WHERE status = 'PAID'
ORDER BY paid_at DESC
LIMIT 10;

-- Lihat booking yang auto-confirmed
SELECT
  booking_code,
  customer_name,
  status,
  updated_at
FROM bookings
WHERE status = 'CONFIRMED'
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Webhook tidak jalan?

**1. Cek Vercel function aktif:**

```
curl -X POST https://your-project.vercel.app/api/moota-callback
```

Response harus: `{"error":"Method not allowed"}` (bukan 404)

**2. Cek Moota webhook URL benar:**

- Harus: `https://your-project.vercel.app/api/moota-callback`
- Bukan: `http://` (harus HTTPS)
- Bukan: tanpa `/api/`

**3. Cek Secret Token match:**

- Secret di Moota = `MOOTA_SECRET_TOKEN` di Vercel
- Case-sensitive!

**4. Cek robot interval:**

- Moota dashboard → Settings → Robot
- Set ke 15 menit atau lebih cepat
- Save settings

**5. Cek logs Vercel:**

- Ada error "Invalid signature" → Secret token salah
- Ada error "Missing Supabase credentials" → Env variables salah
- Ada error "Amount mismatch" → Customer transfer salah nominal

### Customer masih stuck di "Menunggu Verifikasi"?

**Possible causes:**

1. **Webhook baru di-deploy** → Tunggu customer baru berikutnya
2. **Transfer sebelum webhook aktif** → Admin verifikasi manual untuk payment lama
3. **Robot belum jalan** → Max 15 menit tunggu
4. **Nominal salah** → Customer harus transfer exact amount + unique code

**Quick fix untuk payment lama:**

```sql
UPDATE payment_orders
SET status = 'PAID', paid_at = NOW()
WHERE order_id = 'BK-XXX' AND status = 'CHECKING';
```

---

## 💰 Biaya

| Service       | Cost     | Note                  |
| ------------- | -------- | --------------------- |
| Vercel Hobby  | **FREE** | 100GB bandwidth/month |
| Moota Webhook | **FREE** | 0 poin (pakai robot)  |
| Supabase Free | **FREE** | 500MB database        |
| **TOTAL**     | **Rp 0** | Fully free!           |

---

## ✅ Checklist Deploy

- [ ] Code pushed ke GitHub
- [ ] Project imported di Vercel
- [ ] Environment variables set (3 variables)
- [ ] Project deployed (status: Ready)
- [ ] Webhook URL configured di Moota
- [ ] Secret token match
- [ ] Robot interval set (15 min)
- [ ] Test webhook sukses (Moota test button)
- [ ] Test transfer real berhasil auto-verify

---

## 🎯 Hasil Akhir

**SEBELUM (Manual):**

- Customer transfer
- Customer stuck "Menunggu Verifikasi"
- Admin cek Moota dashboard
- Admin klik verifikasi
- Customer bisa lanjut

**SESUDAH (Full Auto):**

- Customer transfer
- Customer tunggu max 15 menit
- **OTOMATIS verified!**
- Customer auto-redirect
- **Admin tidak perlu apa-apa!**

---

## 📞 Support

**Vercel logs kosong?**

- Webhook URL salah atau Moota belum kirim request

**Moota test webhook fail?**

- Check URL, secret token, dan internet connection

**Database tidak update?**

- Check Supabase credentials di Vercel env vars
- Check RLS policies (pakai service_role_key untuk bypass RLS)

**Need help?**
Check Vercel logs first - semua error akan muncul di sana dengan detail lengkap!
