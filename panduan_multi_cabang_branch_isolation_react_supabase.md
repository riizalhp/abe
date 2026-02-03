# 🏪 Panduan Implementasi Multi-Cabang (Branch Isolation)

Panduan **lengkap & siap pakai** untuk menerapkan **isolasi data per cabang (branch isolation)** pada aplikasi **React + Supabase**.
Dokumen ini dirancang agar:
- Aman (data tidak bocor antar cabang)
- Konsisten (semua halaman otomatis pakai branch)
- Scalable (siap untuk POS / SaaS / multi-tenant)

---

## 📋 Daftar Isi

1. Konsep & Prinsip Dasar
2. Desain Arsitektur
3. Setup Database (Supabase)
4. Branch Context (Global State)
5. Global Branch Supabase Wrapper (BEST PRACTICE)
6. Implementasi di Halaman List
7. Implementasi di Form Tambah / Edit
8. Branch Selector (UI)
9. Contoh Modul Lengkap (Products)
10. Row Level Security (RLS)
11. Checklist Migrasi Modul Baru
12. Tips & Best Practices

---

## 1️⃣ Konsep & Prinsip Dasar

**Branch Isolation** berarti:
- Setiap data hanya milik **1 cabang**
- User hanya melihat & memodifikasi data cabang aktif

### Prinsip Wajib

- Semua tabel **WAJIB** punya kolom `branch_id`
- `branch_id` **TIDAK BOLEH** di-hardcode
- Query **HARUS** difilter berdasarkan branch

---

## 2️⃣ Desain Arsitektur

```
┌─────────────────────────────────────┐
│              UI / React             │
│  ┌───────────────────────────────┐ │
│  │ BranchSelector (Header)        │ │
│  └───────────────┬───────────────┘ │
│                  ▼                 │
│        BranchContext (Global)       │
│         activeBranch (id)           │
│                  ▼                 │
│     branchSupabase(branch_id)       │
│                  ▼                 │
│             Supabase DB             │
└─────────────────────────────────────┘
```

---

## 3️⃣ Setup Database (Supabase)

### A. Tabel `branches`

```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B. Tambahkan `branch_id` ke Semua Tabel Operasional

```sql
ALTER TABLE products ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE orders ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE expenses ADD COLUMN branch_id UUID REFERENCES branches(id);
```

### C. Index (WAJIB)

```sql
CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);
```

---

## 4️⃣ Branch Context (Global State)

### `src/store/branchContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Branch {
  id: string;
  name: string;
}

const BranchContext = createContext<any>(null);

export function BranchProvider({ children }: any) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);

      setBranches(data || []);
      const saved = localStorage.getItem("activeBranch");
      if (saved) setActiveBranch(JSON.parse(saved));
      else if (data?.length) setActiveBranch(data[0]);
    };
    load();
  }, []);

  const changeBranch = (branch: Branch) => {
    setActiveBranch(branch);
    localStorage.setItem("activeBranch", JSON.stringify(branch));
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, changeBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
```

---

## 5️⃣ Global Branch Supabase Wrapper (⭐ RECOMMENDED)

**Tujuan:**
> Seluruh halaman **OTOMATIS** pakai `branch_id` tanpa `.eq()` manual

### `src/lib/branchSupabase.ts`

```ts
import { supabase } from "./supabase";

export const branchSupabase = (branchId: string) => ({
  from(table: string) {
    const base = supabase.from(table);

    return {
      select: (query = "*") => base.select(query).eq("branch_id", branchId),

      insert: (payload: any | any[]) =>
        base.insert(
          Array.isArray(payload)
            ? payload.map(p => ({ ...p, branch_id: branchId }))
            : { ...payload, branch_id: branchId }
        ),

      update: (payload: any) =>
        base.update(payload).eq("branch_id", branchId),

      delete: () => base.delete().eq("branch_id", branchId),
    };
  },
});
```

📌 **Aturan keras:**
- ❌ DILARANG import `supabase` langsung di page
- ✅ WAJIB pakai `branchSupabase()`

---

## 6️⃣ Implementasi di Halaman List

```tsx
const { activeBranch } = useBranch();
const db = branchSupabase(activeBranch.id);

const { data } = await db.from("products").select("*");
```

✔ Otomatis filter branch

---

## 7️⃣ Implementasi Form Tambah / Edit

```tsx
await db.from("products").insert({
  name: "Kopi",
  price: 15000,
});
```

✔ `branch_id` otomatis disisipkan

---

## 8️⃣ Branch Selector (UI)

- Diletakkan di Header / Navbar
- Mengubah `activeBranch`
- Semua halaman otomatis refresh data

---

## 9️⃣ Contoh Modul Lengkap (Products)

```tsx
const { activeBranch } = useBranch();
const db = branchSupabase(activeBranch.id);

const load = async () => {
  const { data } = await db.from("products").select("*");
  setProducts(data);
};
```

---

## 🔐 10️⃣ Row Level Security (RLS) — OPSIONAL (HIGH SECURITY)

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY branch_policy
ON products
FOR ALL
USING (
  branch_id IN (
    SELECT branch_id FROM user_branches
    WHERE user_id = auth.uid()
  )
);
```

✔ Aman walau frontend bug

---

## 11️⃣ Checklist Migrasi Modul Baru

### Database
- [ ] Ada kolom `branch_id`
- [ ] Index `branch_id`

### Frontend
- [ ] Pakai `useBranch()`
- [ ] Pakai `branchSupabase()`
- [ ] Tidak import `supabase` langsung

### Testing
- [ ] Data Cabang A tidak muncul di Cabang B
- [ ] Insert otomatis masuk cabang aktif

---

## 12️⃣ Tips & Best Practices

- 🔥 Centralized logic > copy paste
- 🔐 Gabungkan wrapper + RLS untuk produksi
- 🚫 Jangan hardcode branch
- 🧪 Selalu test pindah cabang

---

## ✅ Kesimpulan

**Arsitektur paling ideal:**

```
UI → BranchContext → branchSupabase → Supabase → (RLS)
```

✔ Aman
✔ Bersih
✔ Scalable

---

📌 **Dokumen ini siap dijadikan `ARCHITECTURE.md` / `BRANCH-ISOLATION.md` di repo kamu.**

