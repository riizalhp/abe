# Multi-Tenant Migration Guide

## Ringkasan

Sistem ABE.AUTO sekarang mendukung multi-tenant, artinya:

- **Banyak bengkel** dapat menggunakan platform yang sama
- Setiap bengkel memiliki **data terpisah** (bookings, service records, inventory, staff)
- Setiap bengkel memiliki **URL booking sendiri**: `/booking/:workshop-slug`
- Owner dapat **mengundang staff** untuk bergabung ke workshop mereka

---

## Cara Setup

### 1. Jalankan Migration SQL

Jalankan file `services/multi_tenant_migration.sql` di Supabase SQL Editor:

```sql
-- Buka Supabase Dashboard > SQL Editor > New Query
-- Copy-paste isi file multi_tenant_migration.sql
-- Klik Run
```

Migration ini akan:

- Membuat tabel `workshops` untuk data bengkel
- Membuat tabel `time_slots` untuk slot waktu per bengkel
- Membuat tabel `workshop_invitations` untuk undangan staff
- Menambahkan kolom `workshop_id` ke semua tabel yang ada
- Membuat default workshop untuk data existing
- Setup RLS policies untuk isolasi data

### 2. Struktur Database Baru

```
workshops
├── id (UUID)
├── name (TEXT)
├── slug (TEXT, UNIQUE) -- URL identifier
├── address (TEXT)
├── phone (TEXT)
├── email (TEXT)
├── logo_url (TEXT)
├── description (TEXT)
├── settings (JSONB)
├── is_active (BOOLEAN)
├── subscription_tier (TEXT)
└── subscription_expires_at (TIMESTAMPTZ)

users (updated)
├── ... existing columns ...
├── workshop_id (UUID, FK) -- NEW
├── email (TEXT) -- NEW
└── is_owner (BOOLEAN) -- NEW

bookings (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

service_records (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

inventory (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

reminders (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

moota_settings (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

payment_orders (updated)
├── ... existing columns ...
└── workshop_id (UUID, FK) -- NEW

time_slots (NEW)
├── id (UUID)
├── workshop_id (UUID, FK)
├── day_of_week (INTEGER)
├── start_time (TIME)
├── end_time (TIME)
├── max_bookings (INTEGER)
└── is_active (BOOLEAN)

workshop_invitations (NEW)
├── id (UUID)
├── workshop_id (UUID, FK)
├── email (TEXT)
├── role (TEXT)
├── invite_code (TEXT, UNIQUE)
├── invited_by (UUID, FK)
├── accepted_at (TIMESTAMPTZ)
└── expires_at (TIMESTAMPTZ)
```

---

## Fitur Baru

### 1. URL Booking Per Bengkel

Setiap bengkel memiliki URL booking sendiri:

```
https://yourdomain.com/booking/abe-auto-jakarta
https://yourdomain.com/booking/bengkel-motor-surabaya
https://yourdomain.com/booking/workshop-premium-bandung
```

URL lama `/booking/new` tetap berfungsi untuk backward compatibility.

### 2. Workshop Settings (Owner Only)

Owner dapat mengakses `/workshop-settings` untuk:

- Edit informasi workshop (nama, alamat, telepon, dll)
- Lihat link booking untuk dibagikan ke pelanggan
- Kelola daftar staff
- Undang staff baru

### 3. Sistem Undangan Staff

Flow undangan staff:

1. Owner membuka Workshop Settings > Undangan
2. Masukkan email dan role staff
3. Sistem generate kode undangan (8 karakter)
4. Bagikan link: `/join/KODEINVIT`
5. Staff klik link, login, dan otomatis bergabung ke workshop

### 4. Isolasi Data

Dengan RLS (Row Level Security), setiap staff hanya bisa melihat data workshop mereka sendiri:

- Bookings: hanya bookings untuk workshop sendiri
- Service Records: hanya service records workshop sendiri
- Inventory: hanya inventory workshop sendiri
- Reminders: hanya reminders workshop sendiri

---

## Routes Baru

| Path                      | Description                 | Access     |
| ------------------------- | --------------------------- | ---------- |
| `/booking/:workshopSlug`  | Guest booking per workshop  | Public     |
| `/tracking/:workshopSlug` | Guest tracking per workshop | Public     |
| `/join/:inviteCode`       | Accept staff invitation     | Public     |
| `/workshop-settings`      | Workshop management         | Owner only |

---

## Files Yang Diubah/Ditambah

### New Files

- `services/multi_tenant_migration.sql` - Database migration
- `services/workshopService.ts` - Workshop service layer
- `src/pages/WorkshopSettings.tsx` - Workshop settings page
- `src/pages/JoinWorkshop.tsx` - Accept invitation page

### Modified Files

- `types.ts` - Added Workshop, WorkshopInvitation, TimeSlot interfaces
- `App.tsx` - Added new routes
- `src/components/NewSidebar.tsx` - Added Workshop Settings menu
- `src/pages/GuestBooking.tsx` - Support workshop slug parameter
- `services/bookingService.ts` - Added workshopId mapping

---

## Cara Membuat Workshop Baru

### Via Database (Sementara)

```sql
-- Insert workshop baru
INSERT INTO workshops (name, slug, address, phone)
VALUES ('Bengkel Motor Jaya', 'bengkel-motor-jaya', 'Jl. Raya No. 123', '08123456789');

-- Get workshop ID
SELECT id FROM workshops WHERE slug = 'bengkel-motor-jaya';

-- Update user sebagai owner
UPDATE users
SET workshop_id = 'workshop-uuid-here', is_owner = true
WHERE username = 'owner_username';
```

### Via API (Future)

Akan ditambahkan fitur register workshop baru via UI.

---

## Flow Penggunaan

### Untuk Owner Baru

1. Register/Login sebagai user baru
2. Buat workshop baru (via database/admin)
3. Akses `/workshop-settings`
4. Isi informasi workshop
5. Bagikan link booking ke pelanggan
6. Undang staff jika diperlukan

### Untuk Staff Baru

1. Terima link undangan dari owner: `/join/KODEINVIT`
2. Login/register akun
3. Klik "Gabung Workshop"
4. Otomatis terdaftar sebagai staff dengan role yang ditentukan

### Untuk Pelanggan

1. Buka link booking workshop: `/booking/workshop-slug`
2. Isi form booking
3. Bayar via Moota (jika dikonfigurasi)
4. Terima kode booking
5. Cek status di `/tracking/workshop-slug`

---

## Catatan Penting

1. **Data Lama**: Semua data existing akan diassign ke "default-workshop"
2. **RLS Policies**: Pastikan Supabase RLS sudah aktif
3. **Moota**: Setiap workshop perlu mengkonfigurasi Moota sendiri di `/moota-settings`
4. **Time Slots**: Setiap workshop perlu setup time slots sendiri

---

## Troubleshooting

### Error: "Workshop tidak ditemukan"

- Pastikan slug sudah benar
- Pastikan workshop `is_active = true`

### Staff tidak bisa lihat data

- Pastikan `workshop_id` sudah di-set di user
- Pastikan RLS policies sudah dijalankan

### Undangan tidak bisa digunakan

- Cek apakah sudah expired (`expires_at`)
- Cek apakah sudah digunakan (`accepted_at` tidak null)

---

## Roadmap

- [ ] UI untuk register workshop baru
- [ ] Workshop logo upload
- [ ] Subscription management
- [ ] Workshop analytics dashboard
- [ ] Multi-location per workshop
