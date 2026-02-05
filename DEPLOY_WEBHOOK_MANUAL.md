# 🚀 Deploy Webhook Manual (Tanpa CLI)

## Masalah

CLI install gagal di Windows. Webhook code sudah ada tapi **BELUM DI-DEPLOY**, jadi:

- ❌ Endpoint webhook belum aktif
- ❌ Moota tidak bisa kirim notifikasi
- ⏳ Masih butuh verifikasi manual

## ✅ Solusi: Deploy via Supabase Dashboard

### Option 1: Pakai Supabase CLI (Download Manual)

**Download langsung:**

1. Buka: https://github.com/supabase/cli/releases
2. Download: `supabase_windows_amd64.zip` (atau arm64 jika ARM)
3. Extract ke folder, misal: `C:\supabase-cli\`
4. Add ke PATH atau run langsung dari folder

**Deploy:**

```powershell
cd C:\supabase-cli

# Login
.\supabase.exe login

# Link project
.\supabase.exe link --project-ref YOUR_PROJECT_REF

# Deploy
.\supabase.exe functions deploy moota-callback --no-verify-jwt
```

---

### Option 2: Vercel/Railway (Alternatif Deploy)

Kalau CLI tetap gagal, deploy webhook ke Vercel sebagai serverless function:

#### 1. Create Vercel Project

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
cd C:\Users\LENOVO\Downloads\abe---aplikasi-bengkel
vercel
```

#### 2. Convert Edge Function ke Vercel Format

Create file: `api/moota-callback.ts`

```typescript
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = JSON.stringify(req.body);
    const signature = req.headers["signature"] as string;
    const secretToken = process.env.MOOTA_SECRET_TOKEN!;

    // Verify signature
    const hmac = createHmac("sha256", secretToken);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const mutations = Array.isArray(req.body) ? req.body : [req.body];

    for (const mutation of mutations) {
      if (mutation.type !== "CR" && mutation.type !== "in") {
        continue;
      }

      const description = mutation.description || mutation.note || "";
      const bookingCodeMatch = description.match(/BK-\d+-[a-z0-9]+/i);

      if (!bookingCodeMatch) {
        continue;
      }

      const bookingCode = bookingCodeMatch[0];
      const mutationAmount = parseFloat(mutation.amount);

      // Find payment order
      const { data: paymentOrders } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("order_id", bookingCode)
        .eq("status", "CHECKING")
        .single();

      if (!paymentOrders) {
        continue;
      }

      if (Math.abs(mutationAmount - paymentOrders.total_amount) > 1) {
        continue;
      }

      // Update payment order
      await supabase
        .from("payment_orders")
        .update({
          status: "PAID",
          mutation_id: mutation.mutation_id || mutation.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentOrders.id);

      // Update booking
      await supabase
        .from("bookings")
        .update({ status: "CONFIRMED" })
        .eq("booking_code", bookingCode);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

#### 3. Set Environment Variables di Vercel

Dashboard Vercel > Settings > Environment Variables:

```
MOOTA_SECRET_TOKEN=your_secret_token
SUPABASE_URL=https://irswqjmooxsrpoyndghf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 4. Configure Moota Webhook

URL: `https://your-project.vercel.app/api/moota-callback`

---

### Option 3: Manual Verification (Sementara)

**Sampai webhook aktif, pakai verifikasi manual:**

1. Buka: http://localhost:9000/pending-payments
2. Customer transfer → muncul di list
3. Admin klik "Verifikasi Transfer"
4. Customer auto-redirect ke step 3

**Atau SQL langsung:**

```sql
-- Verifikasi payment
UPDATE payment_orders
SET status = 'PAID', paid_at = NOW()
WHERE order_id = 'BK-XXXX';

-- Update booking
UPDATE bookings
SET status = 'CONFIRMED'
WHERE booking_code = 'BK-XXXX';
```

---

## 📊 Cek Status Webhook

### Webhook Belum Aktif Jika:

- ✅ File `supabase/functions/moota-callback/index.ts` ada (code ready)
- ❌ URL `https://PROJECT.supabase.co/functions/v1/moota-callback` return 404
- ❌ Moota webhook test gagal
- ⏳ Masih butuh verifikasi manual

### Webhook Sudah Aktif Jika:

- ✅ Test webhook di Moota dashboard berhasil
- ✅ Customer transfer → auto-verified tanpa klik admin
- ✅ Log di Supabase Functions menunjukkan request masuk

---

## 🎯 Rekomendasi

**Untuk sekarang:**

- Pakai verifikasi manual di `/pending-payments`
- Admin cek Moota → klik verifikasi
- Zero setup, langsung kerja

**Untuk long-term:**

- Download Supabase CLI manual (Option 1)
- Atau deploy ke Vercel (Option 2)
- Set webhook URL di Moota
- Auto-verification aktif 24/7

---

## 🔧 Troubleshooting

**Q: Kenapa webhook belum otomatis?**
A: Karena code webhook masih di local, belum di-deploy ke server yang bisa diakses Moota.

**Q: Apakah file supabase/functions sudah cukup?**
A: Tidak. File itu hanya code. Perlu deploy ke Supabase server agar punya URL endpoint.

**Q: Bagaimana Moota tahu ada transfer?**
A: Moota kirim POST request ke webhook URL. Kalau URL belum ada (belum deploy), Moota tidak bisa notifikasi.

**Q: Berapa lama setup webhook?**
A: Jika CLI berhasil: 5 menit. Jika pakai Vercel: 10 menit. Manual verification: 0 menit (sudah ready).
