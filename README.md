# ABE - Aplikasi Bengkel Ecosystem

![ABE Logo](https://img.shields.io/badge/ABE-Automotive%20Business%20Ecosystem-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

**ABE (Aplikasi Bengkel Ecosystem)** adalah sistem manajemen bengkel otomotif modern yang dirancang untuk mendigitalkan operasional bengkel "Bengkel Kang Acep" dengan teknologi terkini.

## 🚗 Fitur Utama

### 📋 **Manajemen Operasional**
- **Service Queue Management** - Sistem antrian servis real-time dengan status tracking
- **Online Booking System** - Customer dapat booking servis online dengan AI diagnosis
- **Customer Master Data** - Database pelanggan berdasarkan plat nomor Indonesia (AA-1234-AB)
- **Inventory Management** - Tracking spare parts dan stock real-time
- **Service History** - Riwayat servis komprehensif per pelanggan

### 🤖 **AI-Powered Features**
- **Audio Engine Diagnosis** - Analisis suara mesin menggunakan Google Gemini AI
- **Voice Complaint Analysis** - Kombinasi analisis audio + teks keluhan
- **Predictive Maintenance** - Prediksi jadwal servis berikutnya
- **Auto WhatsApp Marketing** - Generate pesan reminder otomatis

### 👥 **Multi-Role System**
- **Owner/Admin** - Full access, analytics, staff management
- **Mechanic** - Workbench, job management, customer service
- **Staff** - Front office, inventory, customer service
- **Guest** - Online booking, service tracking

### 📱 **Customer Experience**
- **Guest Booking Portal** - Booking tanpa registrasi
- **Real-time Tracking** - Progress tracking dengan status live
- **Payment Integration** - Multiple payment methods
- **Service Rating** - Feedback dan rating mechanic

## 🛠 Tech Stack

### **Frontend**
- **React 18** + **TypeScript** - Modern UI development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Router DOM** - Client-side routing
- **Vite** - Fast build tool

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)

### **AI Integration**
- **Google Gemini AI** - Multimodal AI analysis
- **Audio Processing** - Engine sound diagnosis
- **Text Analysis** - Natural language processing

### **Development Tools**
- **ESLint** + **Prettier** - Code quality
- **Git** - Version control
- **VS Code** - Development environment

## 📦 Installation

### Prerequisites
```bash
Node.js 18+ 
npm atau yarn
Git
```

### 1. Clone Repository
```bash
git clone https://git.weldn.ai/ariefwicaksana/ABE.git
cd ABE
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local dengan konfigurasi Anda
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
```sql
-- Jalankan script SQL di Supabase Dashboard
-- File: services/db_schema.sql
-- File: services/final_schema.sql
-- File: services/seed_data.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:9000`

## 🚀 Deployment

### Build Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📖 Usage Guide

### 🔑 **Default Login**
```
Username: admin
Password: admin123
Role: ADMIN
```

### 📱 **Customer Flow**
1. **Landing Page** → Pilih "Book Service" atau "Track Service"
2. **Guest Booking** → Input data kendaraan + audio rekaman mesin
3. **Payment** → Konfirmasi pembayaran
4. **Tracking** → Monitor progress dengan booking code

### 👨‍🔧 **Staff Workflow**
1. **Dashboard** → Overview statistik bengkel
2. **Front Office** → Handle walk-in customers
3. **Online Bookings** → Review dan approve booking online
4. **Queue Management** → Manage service queue
5. **Mechanic Workbench** → Assign dan track pekerjaan

### 📊 **Admin Features**
- **Staff Management** → CRUD staff, role assignment
- **Inventory** → Stock management, reorder alerts
- **History & Analytics** → Service reports, customer insights
- **CRM** → Customer relationship management

## 🗃 Database Schema

### Core Tables
```sql
users              # Staff & admin accounts
service_records     # Service transactions
bookings           # Online booking requests  
inventory_items    # Spare parts & supplies
service_reminders  # CRM follow-ups
```

### Key Relationships
- **Customer Master Data** → Grouped by license plate (AA-1234-AB format)
- **Service History** → Timeline per customer
- **Inventory Tracking** → Real-time stock updates
- **Multi-role Access** → Row-level security

## 🤖 AI Integration

### Google Gemini AI Setup
1. Get API key dari [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add ke `.env.local`:
   ```
   VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### AI Features
- **Audio Engine Analysis** - Suara mesin → diagnosis masalah
- **Multimodal Analysis** - Audio + text complaint → comprehensive analysis
- **Predictive Maintenance** - Service history → next service prediction
- **Marketing Automation** - Auto-generate WhatsApp reminders

### Fallback Mode
Sistem memiliki fallback mode dengan mock responses untuk development tanpa API key.

## 🔧 Customization

### Indonesian License Plate Format
```typescript
// Utility: services/licensePlateUtils.ts
// Format: AA-1234-AB (sesuai standar Indonesia)
// Customer ID: AA1234AB (untuk database indexing)
```

### Branding
- **Bengkel Name**: "Bengkel Kang Acep"
- **System Name**: "ABE (Aplikasi Bengkel Ecosystem)"
- **Colors**: Blue-based theme dengan Tailwind CSS
- **Logo**: Material Symbols untuk consistency

### Role Permissions
```typescript
enum Role {
  OWNER = 'OWNER',      // Full access
  ADMIN = 'ADMIN',      // Management access  
  MEKANIK = 'MEKANIK',  // Workshop access
  STAFF = 'STAFF'       // Limited access
}
```

## 📱 Screenshots & Demo

### Dashboard
- Real-time statistics
- Revenue tracking
- Service queue overview
- Inventory alerts

### Customer Portal
- Modern booking interface
- Audio recording for engine diagnosis
- Real-time service tracking
- Payment integration

### Mobile Responsive
- Fully responsive design
- Mobile-first approach
- Touch-friendly interactions

## 🤝 Contributing

### Development Workflow
```bash
# 1. Fork repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m 'Add amazing feature'

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Open Pull Request
```

### Code Standards
- **TypeScript** untuk type safety
- **ESLint + Prettier** untuk code formatting
- **Conventional Commits** untuk commit messages
- **Component-based architecture**

### Testing
```bash
# Run tests (when implemented)
npm run test

# Type checking
npm run type-check
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Arief Wicaksana**
- GitHub: [@ariefwicaksana](https://github.com/ariefwicaksana)
- Email: arief@weldn.ai

## 🙏 Acknowledgments

- **Google Gemini AI** - Untuk fitur AI analysis
- **Supabase** - Backend infrastructure
- **Tailwind CSS** - Amazing styling framework
- **React Community** - Untuk ecosystem yang luar biasa
- **Bengkel Kang Acep** - Inspirasi use case nyata

## 📞 Support

Untuk pertanyaan atau support:
- 📧 Email: support@weldn.ai
- 💬 GitHub Issues: [Create Issue](https://git.weldn.ai/ariefwicaksana/ABE/issues)
- 📱 WhatsApp: +62-xxx-xxx-xxxx

---

**Made with ❤️ in Indonesia for the automotive industry**

![Made in Indonesia](https://img.shields.io/badge/Made%20in-Indonesia-red?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgNjAwIj4KICA8cmVjdCB3aWR0aD0iOTAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHdpZHRoPSI5MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmYwMDAwIi8+Cjwvc3ZnPgo=)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
