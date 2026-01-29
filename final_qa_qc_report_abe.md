# 📋 FINAL QA/QC REPORT – UNRESOLVED ITEMS & MULTI-CLIENT SAFETY
Project: **ABE**  
Role: **Senior QA & QC Website Auditor**  
Date: **28 Januari 2026**

---

# 🔴 A. KRITIKAL (WAJIB sebelum rilis)

## 1. Staff Management Belum Real ke Supabase
**Status:** ❌ Belum selesai

**Temuan:**
- Form Add Staff hanya bekerja di sisi UI.
- Tidak ada implementasi:
  - `supabase.auth.signUp()`
  - Insert ke tabel `staff/users`
- Tidak ada role assignment.

**Risiko:**
- Tidak bisa membuat akun karyawan.
- Sistem tidak bisa digunakan operasional.

**Rekomendasi:**
- Buat `staffService.ts`.
- Implement auth + insert profile.
- Hubungkan dengan RLS berbasis role.

---

## 2. Sistem Keamanan Masih Lemah
**Status:** ❌ Belum aman

**Temuan:**
- Tidak ada protected route.
- Tidak ada pengecekan role.
- Tidak terlihat RLS policy ketat.

**Risiko:**
- Akses ilegal.
- Kebocoran data.

**Rekomendasi:**
- Auth Guard.
- Supabase RLS berbasis role.
- Modul access control.

---

## 3. Service History Masih Tidak Stabil
**Status:** ❌ Belum tervalidasi

**Temuan:**
- Belum ada service layer jelas.
- Relasi servis belum kuat.

**Risiko:**
- Data servis tidak akurat.

**Rekomendasi:**
- `serviceHistoryService`.
- Status flow servis yang konsisten.

---

## 4. Inventory Management Belum Berjalan
**Status:** ❌ Tidak berfungsi

**Temuan:**
- Fitur tambah barang tidak menyimpan data ke database.
- Fitur edit barang hanya UI, tidak update data.
- Fitur delete barang tidak menghapus data real.
- Tidak ada validasi stok dan harga.

**Risiko:**
- Data inventory tidak bisa dipercaya.
- Operasional bengkel terganggu.
- Potensi selisih stok.

**Rekomendasi:**
- Buat `inventoryService` (add, edit, delete).
- Pastikan semua aksi terhubung ke Supabase.
- Tambahkan validasi input.
- Hubungkan dengan `stock_logs`.

---

# 🟠 B. PENTING (Sebelum dipakai operasional)

## 5. Belum Ada Stock Movement Log
**Status:** ❌ Belum ada

**Risiko:**
- Tidak bisa audit stok.

**Rekomendasi:**
- Tabel `stock_logs`.
- Trigger atau service logging setiap perubahan stok.

---

## 6. Tidak Ada Error Handling Global
**Status:** ❌ Belum ada

**Risiko:**
- Sulit maintenance.
- UX buruk.

**Rekomendasi:**
- Global error handler.
- Logging error.

---

## 7. Validasi Input Masih Lemah
**Status:** ❌ Lemah

**Rekomendasi:**
- Schema validation (Zod/Yup).
- Proteksi numerik & format input.

---

## 8. Navbar Search Tidak Digunakan
**Status:** ⚠️ Tidak relevan

**Temuan:**
- Search bar di navbar tidak memiliki fungsi.
- Tidak digunakan dalam alur operasional.

**Rekomendasi:**
- **Hapus search navbar** untuk menghindari kebingungan user.
- Bisa dipertimbangkan kembali jika ada global search di masa depan.

---

# 🟡 C. FITUR BELUM TERSEDIA

## 9. Payment Gateway
**Status:** ❌ Belum ada

**Rekomendasi:**
- Integrasi Midtrans atau yang lainnya.

---

## 10. AI Audio Module
**Status:** ❌ Placeholder

**Rekomendasi:**
- Tentukan API atau keluarkan dari scope rilis awal.

---

# 🗄️ D. DATABASE & DATA QUALITY

## 11. Schema Belum Siap Operasional Penuh
**Status:** ❌ Belum matang

**Temuan:**
- Tidak ada audit trail.
- Tidak ada soft delete.
- Relasi belum ketat.

**Rekomendasi:**
- Tambah audit fields (`created_at`, `updated_at`, `deleted_at`).
- Foreign key strict.
- Backup & migration plan.

---

# 🧱 E. ANALISIS MULTI-CLIENT (MULTI BENGKEL)

**Status Arsitektur Saat Ini:**
- ❌ Sistem masih single-tenant.
- ❌ Tidak ada master tabel `workshops`.
- ❌ Tidak ada isolasi data antar bengkel.
- ❌ Tidak terlihat RLS berbasis `workshop_id`.

**Kesimpulan:**
➡️ Sistem **BELUM AMAN** untuk multi-bengkel.  
➡️ Risiko kebocoran data **SANGAT TINGGI**.

---

## Standar Wajib Agar Aman Multi-Bengkel

WAJIB ADA:
- Tabel `workshops`.
- Semua tabel memiliki `workshop_id`.
- JWT menyimpan `workshop_id`.
- Semua query auto filter `workshop_id`.
- Supabase RLS enforce isolasi data.

---

# 🧪 F. FIELD TEST PLAN (UJI LAPANGAN)

## 1. Uji Multi Bengkel
- Buat Bengkel A & Bengkel B.
- Login di device berbeda.
- Input stok & servis masing-masing.

**Expected:**  
❌ Tidak boleh ada data silang.

---

## 2. Uji Role & Hak Akses
- User biasa membuka modul admin.

**Expected:**  
❌ Sistem menolak.

---

## 3. Uji Operasional Bengkel
- Input kendaraan.
- Buat servis.
- Booking.

**Validasi:**
- Alur logis.
- Tidak ada error.
- Mudah dipakai.

---

## 4. Mini Stress Test
Simulasi jam sibuk:
- 2 Owner aktif bersamaan.

**Perhatikan:**
- Data race.
- Double stok.
- Error transaksi.

---

# 🧩 G. BOOKING ONLINE – ISOLASI DATA WAJIB

## Permasalahan
Pelanggan bisa sama (nama/HP), tetapi **booking harus terpisah antar bengkel**.

Jika salah desain:
- Bengkel A bisa melihat booking Bengkel B.
- Data pelanggan tercampur.
- Riwayat servis salah bengkel.

➡️ **HIGH RISK MULTI-TENANT BUG**.

---

## Standar Wajib Booking System

Setiap booking WAJIB memiliki:
- `id` (UUID).
- `workshop_id`.
- `customer_id` (per bengkel).
- `booking_code` (opsional).
- `created_at`.

---

## Aturan Sistem
- Semua query booking wajib filter `workshop_id`.
- JWT user menyimpan `workshop_id`.
- Supabase RLS enforce.

---

## Field Test Booking

**Skenario:**
- Pelanggan nama sama booking di Bengkel A & B.

**Expected:**  
❌ Data booking tidak pernah silang.

---

# 📌 KESIMPULAN FINAL QA

- Bug stok utama sudah diperbaiki.
- Namun sistem masih memiliki:
  - Celah keamanan serius.
  - Belum siap multi-client.
  - Staff & inventory belum real.

➡️ **STATUS: ❌ NOT READY FOR PRODUCTION**

---

# 🎯 PRIORITAS EKSEKUSI

1. Multi-tenant architecture.
2. RLS & access control.
3. Staff management real.
4. Inventory CRUD stabil + stock log.
5. Service history stabilization.
6. Error handling & validation.
7. Payment & AI (opsional pasca rilis).

