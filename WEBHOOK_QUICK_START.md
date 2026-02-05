# Webhook Moota - Quick Start Guide

## ⚡ 5 Menit Setup

### 1. Update `.env`

Add ke file `.env`:

```env
MOOTA_SECRET_TOKEN=your_secret_token_dari_moota
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### 2. Install Dependencies

```bash
npm install express cors dotenv
npm install --save-dev @types/express @types/cors tsx
```

### 3. Run Migration

Buka Supabase Dashboard:

1. SQL Editor → New Query
2. Copy-paste isi `services/webhook_migration.sql`
3. Run query

Field yang ditambah:

- `payment_orders.mutation_id` - Moota mutation reference
- `payment_orders.paid_at` - Timestamp pembayaran
- `bookings.status` - Track booking state

### 4. Deploy Server

#### Option A: Vercel (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Vercel URL: `https://abe-bengkel.vercel.app`

#### Option B: Railway

```bash
# Push ke GitHub
git push origin main

# Di railway.app:
# - Import dari GitHub
# - Add env variables
```

Railway URL otomatis generate

#### Option C: Heroku

```bash
# Login
heroku login

# Deploy
git push heroku main
```

### 5. Setup di Moota Dashboard

**Path**: app.moota.co → Akun Bank → Settings → Webhook

Configure:

- **Webhook URL**: `https://yourdomain.com/api/webhook/moota`
- **Secret Token**: `your_secret_token` (dari .env)
- **Robot Interval**: 15 menit (0 Poin)
- **Type**: Mutations

### 6. Test

```bash
# Test endpoint (development only)
curl -X POST https://yourdomain.com/api/webhook/moota/test \
  -H "Content-Type: application/json" \
  -d '{
    "bookingCode": "BK-1234567890-abc",
    "amount": 50000
  }'
```

Response:

```json
{
  "success": true,
  "message": "Test webhook processed"
}
```

---

## 🔄 How It Works

```
Customer transfer uang
    ↓
Moota robot detect (15 menit)
    ↓ (0 Poin)
POST /api/webhook/moota
    ↓
Verify signature
    ↓
Update payment_orders → PAID
    ↓
Customer polling detect (5 detik)
    ↓
Auto-redirect ke step 3
```

---

## ✅ Verify Setup

Check if webhook working:

1. **Server running**: `PORT 3001` listening
2. **Database**: Run migration script
3. **Moota**: Secret token configured
4. **Test**: Hit test endpoint
5. **Logs**: Check `[Webhook]` logs in server output

---

## 🐛 Troubleshooting

**"Invalid signature"**

- Check MOOTA_SECRET_TOKEN di .env
- Verify exact match di Moota dashboard
- No spaces, no quotes

**"Payment order not found"**

- Booking code format harus `BK-xxx-xxx`
- Amount harus sesuai
- Order status harus `CHECKING` (not PAID)

**Webhook not received**

- Check webhook URL di Moota (no typo)
- Server must be public (not localhost)
- Check firewall/routing
- Verify logs di server output

---

## 📊 Manual vs Webhook

| Feature            | Manual           | Webhook   |
| ------------------ | ---------------- | --------- |
| **Cost**           | 0 Poin           | 0 Poin    |
| **Speed**          | Depends on admin | ~15 menit |
| **Setup**          | Easy             | Medium    |
| **Automation**     | None             | Full      |
| **Current Status** | ✅ Active        | ✅ Ready  |

**Hybrid**: Support keduanya! Admin bisa tetap manual verify sambil webhook berjalan.

---

## 📝 Next Steps

1. ✅ Add webhook handler code (sudah dibuat)
2. ✅ Update env variables (sudah di .env.example)
3. ✅ Database migration (sudah di webhook_migration.sql)
4. ⏭️ Deploy server ke production
5. ⏭️ Setup webhook di Moota dashboard
6. ⏭️ Test dengan transfer real atau test endpoint
7. ⏭️ Monitor logs untuk verify

---

## 🚀 Production Checklist

- [ ] Server deployed
- [ ] Webhook URL configured
- [ ] Secret token set
- [ ] Database migration run
- [ ] Test webhook successful
- [ ] Logs working
- [ ] Customer flow tested
- [ ] Error handling verified

---

## 💡 Pro Tips

1. **Keep both enabled**: Manual verification tetap berfungsi
2. **Monitor logs**: Check `[Webhook]` entries
3. **Test regularly**: Use test endpoint monthly
4. **Backup database**: Before major updates
5. **Alert setup**: Optional - monitor payment failures

---

## 📞 Reference

- Full docs: `WEBHOOK_SETUP_GUIDE.md`
- Handler code: `services/webhook_moota_handler.ts`
- Server code: `server.ts`
- Migration: `services/webhook_migration.sql`
- Example env: `.env.example`
