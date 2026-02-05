# 📖 Panduan Implementasi Moota - Blue-ERP

## Daftar Isi

1. [Pengenalan Moota](#1-pengenalan-moota)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Persiapan & Setup Moota](#3-persiapan--setup-moota)
4. [Konfigurasi Supabase](#4-konfigurasi-supabase)
5. [Implementasi Webhook](#5-implementasi-webhook)
6. [Database Schema](#6-database-schema)
7. [Frontend Integration](#7-frontend-integration)
8. [Flow Pembayaran](#8-flow-pembayaran)
9. [Testing & Debugging](#9-testing--debugging)
10. [Troubleshooting](#10-troubleshooting)
11. [Security Best Practices](#11-security-best-practices)

---

## 1. Pengenalan Moota

### Apa itu Moota?

**Moota** adalah layanan Indonesia yang membantu bisnis untuk:

- ✅ Otomatis mendeteksi mutasi rekening bank
- ✅ Konfirmasi pembayaran secara real-time
- ✅ Webhook notification untuk update pembayaran instan
- ✅ Mendukung berbagai bank Indonesia (BCA, Mandiri, BNI, BRI, dll)

### Bagaimana Moota Bekerja?

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Customer   │───▶│    Bank     │───▶│   Moota     │───▶│  Webhook    │
│  Transfer   │    │  (BCA/BNI)  │    │  Scraping   │    │  Endpoint   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
                                                        ┌─────────────┐
                                                        │  Database   │
                                                        │  (Supabase) │
                                                        └─────────────┘
```

### Keunggulan Menggunakan Moota

| Fitur                 | Deskripsi                               |
| --------------------- | --------------------------------------- |
| **Auto Verification** | Pembayaran diverifikasi otomatis        |
| **Real-time**         | Notifikasi webhook dalam hitungan menit |
| **Multi-Bank**        | Support banyak bank lokal Indonesia     |
| **Unique Code**       | Match pembayaran dengan unique code     |
| **API Friendly**      | REST API & Webhook yang mudah digunakan |

---

## 2. Arsitektur Sistem

### Diagram Arsitektur Blue-ERP + Moota

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              BLUE-ERP SYSTEM                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────────┐  │
│  │   Frontend   │      │   Supabase   │      │     Edge Functions       │  │
│  │   (React)    │◀────▶│   Database   │◀────▶│   (Deno/TypeScript)      │  │
│  │              │      │              │      │                          │  │
│  │ • TopUp.tsx  │      │ • users      │      │ • moota-callback         │  │
│  │ • POS.tsx    │      │ • workshops  │      │ • midtrans-token         │  │
│  │ • Dashboard  │      │ • topup_trx  │      │                          │  │
│  └──────────────┘      │ • trans      │      └────────────▲─────────────┘  │
│                        └──────────────┘                    │               │
│                                                            │               │
└────────────────────────────────────────────────────────────┼───────────────┘
                                                             │
                         ┌───────────────────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │       MOOTA          │
            │  (Payment Gateway)   │
            │                      │
            │  • Bank Integration  │
            │  • Mutation Scraping │
            │  • Webhook Sender    │
            └──────────────────────┘
```

### Komponen Utama

| Komponen      | Teknologi             | Fungsi                     |
| ------------- | --------------------- | -------------------------- |
| Frontend      | React + TypeScript    | UI untuk TopUp & Transaksi |
| Database      | Supabase (PostgreSQL) | Menyimpan data transaksi   |
| Edge Function | Deno/TypeScript       | Menerima webhook Moota     |
| Auth          | Supabase Auth         | Autentikasi pengguna       |
| Realtime      | Supabase Realtime     | Update saldo live          |

---

## 3. Persiapan & Setup Moota

### Step 1: Daftar Akun Moota

1. Kunjungi [https://moota.co](https://moota.co)
2. Klik **"Daftar"** dan isi informasi
3. Verifikasi email Anda
4. Login ke dashboard Moota

### Step 2: Tambahkan Rekening Bank

1. Di Dashboard Moota, klik **"Bank Account"** → **"Add Bank"**
2. Pilih bank (BCA, Mandiri, BNI, BRI, dll)
3. Masukkan kredensial internet banking:
   - Username/User ID
   - Password
   - PIN (jika diperlukan)
4. Moota akan melakukan sinkronisasi otomatis

> ⚠️ **PENTING**: Gunakan akun khusus untuk bisnis. JANGAN gunakan akun pribadi utama!

### Step 3: Dapatkan API Key

1. Di Dashboard Moota, klik **"Settings"** → **"API"**
2. Klik **"Generate API Key"**
3. Salin dan simpan dengan aman:

```env
# .env.local atau Supabase Secrets
MOOTA_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MOOTA_SECRET_KEY=your-secret-key-here
```

### Step 4: Setup Webhook URL

1. Di Dashboard Moota, klik **"Settings"** → **"Webhook"**
2. Masukkan URL webhook Anda:

```
https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/moota-callback
```

3. Pilih events yang ingin dinotifikasi:
   - ✅ **Bank Mutation (Credit)** - Pembayaran masuk
   - ✅ **Bank Mutation (Debit)** - Optional untuk tracking pengeluaran

4. Klik **"Save"**

### Step 5: Testing Webhook (Sandbox Mode)

Moota menyediakan mode Sandbox untuk testing:

1. Aktifkan **Sandbox Mode** di Settings
2. Gunakan test mutation untuk simulasi pembayaran
3. Verifikasi webhook diterima dengan benar

---

## 4. Konfigurasi Supabase

### Environment Variables

Set environment variables di Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (untuk validasi webhook)
MOOTA_WEBHOOK_SECRET=your-webhook-secret
```

### Deploy Edge Function

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Login ke Supabase:

```bash
supabase login
```

3. Link ke project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Deploy function:

```bash
supabase functions deploy moota-callback --no-verify-jwt
```

> ⚠️ `--no-verify-jwt` diperlukan karena webhook Moota tidak mengirim JWT Supabase

### Konfigurasi CORS (jika diperlukan)

Tambahkan di `supabase/config.toml`:

```toml
[functions.moota-callback]
enabled = true
verify_jwt = false
```

---

## 5. Implementasi Webhook

### Struktur Folder

```
supabase/
└── functions/
    └── moota-callback/
        └── index.ts
```

### Kode Webhook Handler

File: `supabase/functions/moota-callback/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Moota Callback Function Up!");

serve(async (req) => {
  try {
    // 1. Initialize Supabase Client dengan Service Role Key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Parse Request Body
    const body = await req.json();
    console.log("Received Webhook Body:", JSON.stringify(body));

    // 3. Moota mengirim mutations dalam array
    const mutations = Array.isArray(body) ? body : body.mutations || [body];
    const results = [];

    // 4. Process setiap mutation
    for (const mut of mutations) {
      // Cek apakah ini income (Credit/CR)
      const isIncome =
        mut.type?.toUpperCase() === "CR" ||
        mut.type?.toLowerCase() === "credit" ||
        mut.amount > 0;

      if (isIncome) {
        const amount =
          typeof mut.amount === "string" ? parseFloat(mut.amount) : mut.amount;

        // Extract unique_code dari 3 digit terakhir
        const uniqueCode = amount % 1000;
        const baseAmount = amount - uniqueCode;

        console.log(
          `Processing: Amount=${amount}, Base=${baseAmount}, Code=${uniqueCode}`,
        );

        // 5a. Cari di Regular Transactions
        const { data: trans } = await supabase
          .from("transactions")
          .select("*")
          .eq("unique_code", uniqueCode)
          .eq("total_amount", baseAmount)
          .in("status", ["pending_payment", "pending"])
          .limit(1)
          .maybeSingle();

        if (trans) {
          console.log(`Match Found in Transactions: ${trans.id}`);

          // Update status berdasarkan current status
          let newStatus =
            trans.status === "pending_payment"
              ? "pending" // Lanjut ke Kitchen
              : "paid"; // Selesai

          await supabase
            .from("transactions")
            .update({ status: newStatus, payment_method: "transfer" })
            .eq("id", trans.id);

          results.push({
            id: trans.id,
            type: "transaction",
            status: newStatus,
          });
          continue;
        }

        // 5b. Cari di Top Up Transactions
        const { data: topup } = await supabase
          .from("topup_transactions")
          .select("*")
          .eq("unique_code", uniqueCode)
          .eq("amount", baseAmount)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle();

        if (topup) {
          console.log(`Match Found in TopUps: ${topup.id}`);

          await supabase
            .from("topup_transactions")
            .update({ status: "paid", payment_method: "transfer" })
            .eq("id", topup.id);

          results.push({
            id: topup.id,
            type: "topup",
            status: "paid",
          });
        } else {
          console.log(`No match found for Amount ${amount}`);
        }
      }
    }

    // 6. Return Response
    return new Response(
      JSON.stringify({ processed: results.length, details: results }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Critical Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
});
```

### Format Payload Moota

Moota mengirim data dalam format berikut:

```json
[
  {
    "id": "hash_mutation_id",
    "bank_id": "bank_xxx",
    "account_number": "1234567890",
    "bank_type": "bca",
    "date": "2024-01-15 14:30:00",
    "amount": "100123",
    "description": "TRANSFER DR 123456 JOHN DOE",
    "type": "CR",
    "balance": "5000000"
  }
]
```

| Field            | Tipe          | Deskripsi                     |
| ---------------- | ------------- | ----------------------------- |
| `id`             | string        | Unique mutation ID            |
| `bank_id`        | string        | ID bank di Moota              |
| `account_number` | string        | Nomor rekening                |
| `bank_type`      | string        | Tipe bank (bca, mandiri, dll) |
| `date`           | string        | Tanggal & waktu mutasi        |
| `amount`         | string/number | Jumlah transfer               |
| `description`    | string        | Deskripsi dari bank           |
| `type`           | string        | CR (Credit) atau DB (Debit)   |
| `balance`        | string        | Saldo akhir                   |

---

## 6. Database Schema

### Tabel: `topup_transactions`

```sql
CREATE TABLE public.topup_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Amount & Matching
    amount NUMERIC NOT NULL,
    unique_code INTEGER NOT NULL,  -- 3 digit terakhir (1-999)

    -- Status: 'pending', 'paid', 'expired', 'cancelled'
    status VARCHAR(20) DEFAULT 'pending',

    -- Relations
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workshop_id UUID REFERENCES public.workshops(id),

    -- Payment Info
    payment_method VARCHAR(50),  -- 'transfer', 'manual', etc

    -- Idempotency Flag (mencegah double counting)
    is_processed BOOLEAN DEFAULT FALSE
);
```

### Tabel: `transactions` (Order Transaksi)

```sql
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date TIMESTAMPTZ DEFAULT now(),

    -- Amount & Matching
    total_amount NUMERIC NOT NULL,
    unique_code INTEGER,  -- Untuk matching dengan Moota

    -- Status: 'pending', 'pending_payment', 'cooking', 'ready', 'paid', 'cancelled'
    status VARCHAR(20) DEFAULT 'pending',

    -- Customer Info
    customer_name VARCHAR(255),
    table_number VARCHAR(10),
    is_table_cleared BOOLEAN DEFAULT FALSE,

    -- Relations
    workshop_id UUID REFERENCES public.workshops(id),
    cashier_id UUID REFERENCES auth.users(id),

    -- Payment Info
    payment_method VARCHAR(50),  -- 'cash', 'transfer', 'midtrans'
    note TEXT
);
```

### Trigger: Auto Update Balance

```sql
-- Trigger untuk update saldo workshop saat TopUp berhasil
CREATE OR REPLACE FUNCTION public.handle_topup_balance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_workshop_id UUID;
BEGIN
    -- Hanya proses jika status berubah ke 'paid'
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN

        -- Ambil workshop_id dari transaksi atau user
        IF NEW.workshop_id IS NOT NULL THEN
            v_workshop_id := NEW.workshop_id;
        ELSE
            SELECT workshop_id INTO v_workshop_id
            FROM public.users WHERE id = NEW.owner_id;
        END IF;

        -- Update balance workshop
        IF v_workshop_id IS NOT NULL THEN
            UPDATE public.workshops
            SET balance = COALESCE(balance, 0) + NEW.amount
            WHERE id = v_workshop_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
CREATE TRIGGER on_topup_paid
AFTER UPDATE ON public.topup_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_topup_balance_update();
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.topup_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa melihat topup milik sendiri
CREATE POLICY "Users can view own topups"
ON public.topup_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Policy: User bisa membuat topup untuk diri sendiri
CREATE POLICY "Users can insert own topups"
ON public.topup_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);
```

---

## 7. Frontend Integration

### Service Layer: TransactionService.ts

```typescript
// src/services/TransactionService.ts

import { supabase } from "@/lib/supabase";

export const TransactionService = {
  /**
   * Membuat Top Up Transaction
   * @param amount - Nominal top up
   * @param ownerId - User ID
   * @param workshopId - Workshop ID
   */
  async createTopUp(amount: number, ownerId: string, workshopId: string) {
    // Generate unique code (1-999)
    const uniqueCode = Math.floor(Math.random() * 999) + 1;

    const { data: trx, error } = await supabase
      .from("topup_transactions")
      .insert([
        {
          amount,
          unique_code: uniqueCode,
          status: "pending",
          owner_id: ownerId,
          workshop_id: workshopId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return trx;
  },

  /**
   * Complete Top Up (Manual confirmation)
   */
  async completeTopUp(id: string, paymentMethod: string) {
    const { error } = await supabase
      .from("topup_transactions")
      .update({
        status: "paid",
        payment_method: paymentMethod,
      })
      .eq("id", id);

    if (error) throw error;
    return true;
  },
};
```

### UI Component: TopUp.tsx

```tsx
// src/pages/TopUp.tsx

import { useState } from "react";
import { TransactionService } from "@/services/TransactionService";
import { useAuth } from "@/store/authContext";

export default function TopUp() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [transferInfo, setTransferInfo] = useState<any>(null);

  const handleTopUp = async () => {
    const nominal = parseInt(amount.replace(/\./g, ""));

    if (!nominal || nominal < 10000) {
      alert("Minimal Top Up Rp 10.000");
      return;
    }

    setLoading(true);

    try {
      // Create pending top up transaction
      const trx = await TransactionService.createTopUp(
        nominal,
        user.id,
        user.workshop_id,
      );

      // Calculate final amount (nominal + unique code)
      const finalAmount = trx.amount + trx.unique_code;

      // Show transfer instructions
      setTransferInfo({
        transactionId: trx.id,
        amount: trx.amount,
        uniqueCode: trx.unique_code,
        finalAmount: finalAmount,
        bankAccount: "1234567890", // Rekening tujuan
        bankName: "BCA",
      });
    } catch (error: any) {
      console.error("TopUp Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Input Amount */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Masukkan nominal"
      />

      <button onClick={handleTopUp} disabled={loading}>
        {loading ? "Processing..." : "Top Up Sekarang"}
      </button>

      {/* Transfer Instructions Modal */}
      {transferInfo && (
        <div className="modal">
          <h3>Instruksi Transfer</h3>
          <p>Bank: {transferInfo.bankName}</p>
          <p>No. Rekening: {transferInfo.bankAccount}</p>
          <p>
            <strong>
              Total Transfer: Rp {transferInfo.finalAmount.toLocaleString()}
            </strong>
          </p>
          <p className="text-red-500">
            * Termasuk kode unik {transferInfo.uniqueCode}
          </p>
          <p className="text-sm">
            Transfer dengan jumlah TEPAT agar terverifikasi otomatis
          </p>
        </div>
      )}
    </div>
  );
}
```

### Realtime Balance Updates

```tsx
// src/store/authContext.tsx

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Subscribe ke perubahan balance workshop
useEffect(() => {
  if (!user?.workshop_id) return;

  const channel = supabase
    .channel(`balance_workshop_${user.workshop_id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "workshops",
        filter: `id=eq.${user.workshop_id}`,
      },
      (payload) => {
        // Update balance di state
        setBalance(payload.new.balance);

        // Show notification
        if (payload.new.balance > payload.old.balance) {
          showToast("Saldo berhasil ditambahkan!", "success");
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.workshop_id]);
```

---

## 8. Flow Pembayaran

### Flow 1: Top Up Saldo Token

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOP UP FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER                    2. FRONTEND                 3. DATABASE
   │                          │                           │
   │  Input nominal           │                           │
   │─────────────────────────▶│                           │
   │                          │  Create topup_transaction │
   │                          │──────────────────────────▶│
   │                          │                           │
   │                          │  Return: {amount, unique_code}
   │                          │◀──────────────────────────│
   │  Show transfer info      │                           │
   │◀─────────────────────────│                           │
   │                          │                           │
   │  Transfer Rp 50.123      │                           │
   │  (50.000 + 123)          │                           │
   │                          │                           │
   ▼                          ▼                           ▼

4. BANK                   5. MOOTA                    6. WEBHOOK
   │                          │                           │
   │  Mutation detected       │                           │
   │─────────────────────────▶│                           │
   │                          │  Webhook: amount=50123    │
   │                          │──────────────────────────▶│
   │                          │                           │
   │                          │                           │  Match: unique_code=123
   │                          │                           │         amount=50000
   │                          │                           │
   │                          │                           │  UPDATE status='paid'
   │                          │                           │─────────────┐
   │                          │                           │             │
   │                          │                           │◀────────────┘
   │                          │                           │
   │                          │                           │  TRIGGER: balance += 50000
   │                          │                           │─────────────┐
   │                          │                           │             │
   │                          │                           │◀────────────┘
   ▼                          ▼                           ▼

7. REALTIME               8. USER
   │                          │
   │  Balance updated         │
   │─────────────────────────▶│
   │                          │
   │                          │  ✅ Saldo bertambah!
   │                          │
```

### Flow 2: Pembayaran Order (Transfer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ORDER PAYMENT FLOW (CASHLESS)                            │
└─────────────────────────────────────────────────────────────────────────────┘

CUSTOMER                 MENU PAGE               DATABASE               MOOTA
   │                         │                      │                      │
   │  Pilih menu             │                      │                      │
   │  Nama: John             │                      │                      │
   │  Meja: 5                │                      │                      │
   │  Payment: Cashless      │                      │                      │
   │────────────────────────▶│                      │                      │
   │                         │                      │                      │
   │                         │  INSERT transaction  │                      │
   │                         │  status='pending'    │                      │
   │                         │  unique_code=456     │                      │
   │                         │─────────────────────▶│                      │
   │                         │                      │                      │
   │  Transfer: Rp 100.456   │                      │                      │
   │  (100.000 + 456)        │                      │                      │
   │                         │                      │                      │
   │                         │                      │  Webhook received    │
   │                         │                      │◀─────────────────────│
   │                         │                      │                      │
   │                         │                      │  Match & Update      │
   │                         │                      │  status='paid'       │
   │                         │                      │                      │
   ▼                         ▼                      ▼                      ▼

KITCHEN                  POS/CASHIER
   │                         │
   │  Order received         │  Payment confirmed
   │  (Realtime)             │  (Realtime)
   │                         │
```

---

## 9. Testing & Debugging

### Testing Webhook Lokal

1. **Install ngrok** untuk expose localhost:

```bash
npm install -g ngrok
```

2. **Jalankan Supabase Functions lokal**:

```bash
supabase functions serve moota-callback --no-verify-jwt
```

3. **Expose dengan ngrok**:

```bash
ngrok http 54321
```

4. **Update Webhook URL di Moota**:

```
https://abc123.ngrok.io/functions/v1/moota-callback
```

### Testing dengan cURL

```bash
# Simulasi webhook dari Moota
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test-mutation-001",
    "bank_id": "bank_xxx",
    "account_number": "1234567890",
    "bank_type": "bca",
    "date": "2024-01-15 14:30:00",
    "amount": "50123",
    "description": "TEST TRANSFER",
    "type": "CR",
    "balance": "1000000"
  }]'
```

### Memeriksa Logs

```bash
# View function logs
supabase functions logs moota-callback --follow
```

### SQL Testing

```sql
-- Test: Cek transaksi pending
SELECT * FROM topup_transactions
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Test: Simulasi match
SELECT * FROM topup_transactions
WHERE unique_code = 123
AND amount = 50000
AND status = 'pending';

-- Test: Cek balance workshop
SELECT id, name, balance FROM workshops;
```

---

## 10. Troubleshooting

### Masalah Umum & Solusi

#### ❌ Webhook tidak diterima

**Kemungkinan Penyebab:**

- URL webhook salah
- Edge Function tidak di-deploy
- verify_jwt = true (harusnya false)

**Solusi:**

```bash
# Re-deploy dengan flag no-verify-jwt
supabase functions deploy moota-callback --no-verify-jwt

# Cek logs
supabase functions logs moota-callback
```

#### ❌ Pembayaran tidak ter-match

**Kemungkinan Penyebab:**

- Unique code tidak sesuai
- Amount tidak tepat
- Status sudah bukan 'pending'

**Solusi:**

```sql
-- Debug: Lihat semua pending transactions
SELECT id, amount, unique_code, status, created_at
FROM topup_transactions
WHERE status = 'pending';

-- Hitung expected amount
-- Jika user transfer 50.123, maka:
-- amount = 50000
-- unique_code = 123
```

#### ❌ Balance tidak bertambah

**Kemungkinan Penyebab:**

- Trigger tidak ada/rusak
- RLS blocking update
- workshop_id NULL

**Solusi:**

```sql
-- Cek trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%topup%';

-- Cek trigger function
SELECT * FROM pg_proc WHERE proname LIKE '%topup%';

-- Manual test trigger
UPDATE topup_transactions
SET status = 'paid'
WHERE id = 'YOUR_TRX_ID';
```

#### ❌ Double Balance (Saldo 2x lipat)

**Penyebab:**

- Duplicate triggers
- Race condition antara client update dan webhook

**Solusi:**
Gunakan idempotency flag:

```sql
-- Tambah kolom is_processed
ALTER TABLE topup_transactions
ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE;

-- Update trigger untuk cek flag
CREATE OR REPLACE FUNCTION handle_topup_balance_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND NEW.is_processed = FALSE THEN
        -- Update balance...
        NEW.is_processed := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Security Best Practices

### 1. Validasi Webhook Source

```typescript
// Verifikasi webhook berasal dari Moota
const signature = req.headers.get("X-Moota-Signature");
const webhookSecret = Deno.env.get("MOOTA_WEBHOOK_SECRET");

// Validate signature (implementasi sesuai dokumentasi Moota)
if (!validateSignature(signature, body, webhookSecret)) {
  return new Response("Unauthorized", { status: 401 });
}
```

### 2. Gunakan Service Role Key

```typescript
// SELALU gunakan Service Role Key di Edge Functions
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), // Bukan Anon Key!
);
```

### 3. Jangan Expose Secrets

```bash
# ❌ JANGAN lakukan ini
const API_KEY = "eyJhbGciOiJIUzI1NiIs...";

# ✅ Gunakan environment variables
const API_KEY = Deno.env.get('MOOTA_API_KEY');
```

### 4. Rate Limiting

```typescript
// Implementasi simple rate limiting
const rateLimitMap = new Map();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];

  // Filter requests dalam 1 menit terakhir
  const recentRequests = requests.filter((time: number) => now - time < 60000);

  if (recentRequests.length >= 10) {
    return true;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}
```

### 5. Logging & Monitoring

```typescript
// Log semua webhook untuk audit
console.log(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    source: "moota-webhook",
    mutation_id: mut.id,
    amount: mut.amount,
    matched: !!result,
  }),
);
```

---

## Checklist Implementasi

### Persiapan

- [ ] Daftar akun Moota
- [ ] Tambah rekening bank
- [ ] Generate API Key
- [ ] Setup Webhook URL

### Database

- [ ] Buat tabel `topup_transactions`
- [ ] Buat trigger balance update
- [ ] Setup RLS policies
- [ ] Enable Realtime untuk workshops

### Backend

- [ ] Buat Edge Function `moota-callback`
- [ ] Deploy ke Supabase
- [ ] Set environment variables
- [ ] Test webhook dengan cURL

### Frontend

- [ ] Implementasi TopUp page
- [ ] Tampilkan instruksi transfer
- [ ] Subscribe ke Realtime updates
- [ ] Handle success/error states

### Testing

- [ ] Test dengan Moota Sandbox
- [ ] Test unique code matching
- [ ] Verify balance updates
- [ ] Test edge cases (double payment, expired, etc)

### Production

- [ ] Switch ke Moota Production mode
- [ ] Update webhook URL (production)
- [ ] Monitor logs
- [ ] Setup alerts untuk errors

---

## Referensi

- [Moota Documentation](https://docs.moota.co)
- [Moota API Reference](https://app.moota.co/developer)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

_Dokumentasi ini dibuat untuk Blue-ERP Project - Februari 2026_
