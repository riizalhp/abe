# Dokumentasi Implementasi Moota Payment

## Ringkasan

Integrasi Moota menggantikan sistem QRIS dinamis dengan sistem pembayaran transfer bank otomatis menggunakan Moota API v2. Sistem ini menggunakan **unique code** untuk mengidentifikasi setiap pembayaran secara unik.

## Cara Kerja

### 1. Alur Pembayaran

1. Customer memilih metode pembayaran Bank Transfer (Moota)
2. Sistem generate unique code (contoh: 1-999)
3. Customer melihat nominal transfer: **Jumlah + Unique Code**
   - Contoh: Rp 500.000 + 123 = Rp 500.123
4. Customer transfer ke rekening bengkel
5. Moota mendeteksi mutasi masuk
6. Sistem otomatis mencocokkan nominal dan konfirmasi pembayaran

### 2. Kelebihan vs QRIS Dinamis

| Aspek        | QRIS Dinamis        | Moota                  |
| ------------ | ------------------- | ---------------------- |
| Biaya        | Fee per transaksi   | Langganan bulanan      |
| Verifikasi   | Manual/QR Code      | Otomatis               |
| Bank Support | Semua bank via QRIS | Multi-bank langsung    |
| Webhook      | Tidak ada           | Real-time notification |

## File yang Dibuat

### 1. Service Layer

- [mootaService.ts](services/mootaService.ts) - Core service untuk integrasi Moota API

### 2. Database Migration

- [moota_migration.sql](services/moota_migration.sql) - SQL migration untuk tabel:
  - `moota_settings` - Konfigurasi API Moota
  - `payment_orders` - Order pembayaran dengan unique code
  - `moota_webhook_logs` - Log webhook untuk debugging

### 3. UI Components

- [MootaSettings.tsx](src/pages/MootaSettings.tsx) - Halaman konfigurasi Moota
- [MootaPayment.tsx](src/components/MootaPayment.tsx) - Komponen pembayaran

### 4. Updated Files

- [types.ts](types.ts) - Ditambahkan `PaymentMethod.MOOTA`
- [App.tsx](App.tsx) - Ditambahkan route `/moota-settings`
- [NewSidebar.tsx](src/components/NewSidebar.tsx) - Ditambahkan menu Moota Payment

## Setup

### 1. Jalankan Migration

Jalankan file `moota_migration.sql` di Supabase SQL Editor:

```sql
-- Copy paste isi file moota_migration.sql
```

### 2. Dapatkan API Token Moota

1. Daftar/Login di https://app.moota.co
2. Tambahkan rekening bank di Moota
3. Pergi ke Settings > API Token
4. Copy token dan paste di halaman Moota Settings aplikasi

### 3. Konfigurasi di Aplikasi

1. Login sebagai Admin/Owner
2. Pergi ke menu "Moota Payment" di sidebar
3. Masukkan API Token dan klik "Test Connection"
4. Pilih rekening bank yang akan digunakan
5. Generate secret token untuk webhook
6. Klik "Save Settings"

## Penggunaan Komponen MootaPayment

```tsx
import MootaPayment from "./src/components/MootaPayment";

// Contoh penggunaan
<MootaPayment
  amount={500000}
  orderId="ORDER-12345"
  customerName="John Doe"
  customerPhone="08123456789"
  description="Service Motor Honda Beat"
  onPaymentComplete={(order) => {
    console.log("Pembayaran berhasil!", order);
    // Navigate atau update status
  }}
  onPaymentExpired={() => {
    console.log("Pembayaran expired");
  }}
  onCancel={() => {
    console.log("Pembayaran dibatalkan");
  }}
  autoCheck={true} // Auto-check setiap interval
  checkInterval={30} // Check setiap 30 detik
/>;
```

## API Endpoints yang Digunakan

| Endpoint                                         | Deskripsi                |
| ------------------------------------------------ | ------------------------ |
| `GET /api/v2/bank`                               | Ambil list rekening bank |
| `POST /api/v2/bank/{id}/refresh`                 | Refresh mutasi bank      |
| `GET /api/v2/mutation`                           | Ambil list mutasi        |
| `GET /api/v2/bank/{id}/mutation/search/{amount}` | Cari mutasi by nominal   |

## Webhook Setup (Optional)

Untuk real-time notification, setup webhook di Moota:

1. URL: `https://your-domain.com/api/moota/webhook`
2. Secret Token: Gunakan yang digenerate di aplikasi
3. Event Type: Credit only
4. Bank: Pilih bank yang dikonfigurasi

Contoh handler webhook (backend):

```javascript
app.post("/api/moota/webhook", async (req, res) => {
  const signature = req.headers["signature"];
  const payload = req.body;

  const result = await mootaService.handleWebhook(
    payload,
    signature,
    process.env.MOOTA_SECRET_TOKEN,
  );

  res.json(result);
});
```

## Troubleshooting

### Pembayaran Tidak Terdeteksi

1. Pastikan nominal yang ditransfer **PERSIS** sama
2. Tunggu 1-2 menit untuk sinkronisasi Moota
3. Klik tombol "I've Completed the Transfer" untuk check manual
4. Pastikan rekening bank aktif di Moota

### Connection Error

1. Periksa API Token sudah benar
2. Pastikan ada koneksi internet
3. Periksa saldo point di Moota

### Unique Code Habis

Jika error "Unable to generate unique code":

- Perbesar range unique code di settings
- Atau tunggu hingga hari berikutnya (reset per hari)

## Keamanan

- API Token disimpan terenkripsi di database
- Secret Token untuk validasi webhook
- Unique code di-generate random per hari
- Payment order expire dalam 24 jam
