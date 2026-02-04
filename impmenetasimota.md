Master Prompt: Implementasi Sistem Pembayaran Moota (Kode Unik)
Instruksi: Copy dan paste seluruh prompt di bawah ini ke Antigravity / Agent AI Anda untuk membangun sistem pembayaran otomatis berbasis Kode Unik (Moota).

🤖 AI Identity & Context
Role: Senior Fullstack Engineer (React, TypeScript, Supabase/Node.js). Objective: Mengimplementasikan fitur "Top Up / Pembayaran dengan Kode Unik" yang kompatibel dengan sistem mutasi bank Moota. Tech Stack: [Sesuaikan dengan project Anda, misal: Next.js/Vite + Supabase/PostgreSQL + Tailwind CSS].

📋 Detail Spesifikasi Fitur
1. Konsep Bisnis
Sistem tidak menggunakan Virtual Account. User mentransfer ke rekening bank biasa, namun nominal ditambah 3 digit kode unik.

Input User: Rp 50.000
System Generate: Kode Unik 123
Total Tagihan: Rp 50.123
Verifikasi: Jika ada mutasi masuk sebesar Rp 50.123, sistem otomatis menandai transaksi "Lunas".
2. Database Schema (SQL)
Mohon buatkan/migrasikan tabel transactions dengan struktur berikut:

id
 (UUID, Primary Key)
user_id (UUID, Foreign Key)
original_amount (BigInt/Number) -> Nominal asli (Rp 50.000)
unique_code (Int) -> 3 digit acak (1-999)
total_amount (BigInt/Number) -> Nominal + Kode Unik (Rp 50.123)
status (Enum/Text) -> 'pending', 'paid', 'expired', 'failed'
payment_method (Text) -> default 'bank_transfer'
created_at (Timestamp)
expires_at (Timestamp) -> Valid selama 24 jam.
3. Backend Logic (Service Layer)
Buatkan fungsi 
createTopUp(userId, amount)
 yang melakukan:

Validasi amount > 10.000 (jika ada batas).
Generate unique_code (Random 1-999).
(Optional/Robust) Cek ke DB apakah kode unik tersebut sedang dipakai oleh transaksi 'pending' lain dalam rentang waktu yang sama (Collision Check). Jika ya, generate ulang.
Insert ke tabel transactions.
Return object transaksi lengkap.
4. Frontend UI (Payment Page)
Buatkan komponen React PaymentPage.tsx atau TopUpInstruction.tsx yang menarik:

Input Nominal: Form input angka.
Instruksi Transfer (Overlay/Modal):
Tampilkan Bank & No Rekening (misal: BCA 1234567890 a.n PT Kita).
Total Transfer: Tampilkan angka besar. Highlight 3 digit terakhir dengan warna berbeda (misal merah) agar user sadar itu penting.
Contoh: Rp 50.123.
Button "Copy Nominal" dan "Copy No Rekening".
Timer Countdown (jika ada expires_at).
Button "Saya Sudah Transfer" (untuk cek manual/refresh status).
5. Webhook Handler (Automation)
Buatkan API Endpoint (Misal: Supabase Edge Function atau Node.js Route) /api/webhooks/moota untuk menerima notifikasi dari Moota:

Terima payload JSON dari Moota (biasanya berisi bank_id, amount, type=CR/DB).
Filter hanya type == 'CR' (Credit/Uang Masuk).
Cari transaksi di DB dengan status = 'pending' DAN total_amount == amount dari payload.
Jika ketemu:
Update status jadi 'paid'.
Tambahkan saldo ke user (jika sistem wallet).
Return 200 OK.
Jika tidak ketemu: Return 200/404 (Log error).
🛠️ Step-by-Step Implementation Plan
Mohon kerjakan dalam urutan berikut:

Database: Berikan query SQL untuk membuat tabel.
Backend Core: Tulis kode TypeScript untuk 
createTopUp
 service.
Frontend: Buat komponen UI TopUpPage lengkap dengan Tailwind CSS.
Webhook: Tulis draft kode untuk Webhook Handler.
Silakan mulai dari langkah 1.