export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  KASIR = 'KASIR',
  MEKANIK = 'MEKANIK',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface Workshop {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  description?: string;
  settings?: Record<string, any>;
  isActive: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopInvitation {
  id: string;
  workshopId: string;
  email: string;
  role: Role;
  inviteCode: string;
  invitedBy?: string;
  acceptedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export enum QueueStatus {
  WAITING = 'MENUNGGU',
  PROCESS = 'DIKERJAKAN',
  PENDING = 'PENDING', // Waiting for parts
  FINISHED = 'SELESAI',
  PAID = 'LUNAS',
  CANCELLED = 'BATAL',
  VOID = 'VOID',
}

export enum BookingStatus {
  PENDING = 'PENDING_REVIEW', // Guest submitted, waiting for admin
  CONFIRMED = 'CONFIRMED', // Admin approved & AI run
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN' // Moved to actual service queue
}

export enum ServiceWeight {
  LIGHT = 'RINGAN',
  MEDIUM = 'SEDANG',
  HEAVY = 'BERAT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
  TRANSFER = 'TRANSFER',
  DEBIT = 'DEBIT',
  MOOTA = 'MOOTA', // Bank transfer via Moota
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'TERKIRIM',
  BOOKED = 'SUDAH_BOOKING',
  SKIPPED = 'DIABAIKAN',
}

export interface User {
  id: string;
  name: string;
  username: string; // Added for login
  password?: string; // Added for login
  email?: string;
  role: Role;
  avatar: string;
  specialization?: string; // For mechanics
  status?: 'ACTIVE' | 'BUSY' | 'OFF';
  workshopId?: string; // Multi-tenant: workshop this user belongs to
  isOwner?: boolean; // Whether this user owns the workshop
}

export interface ServiceRecord {
  id: string;
  ticketNumber: string;
  licensePlate: string;
  customerName: string;
  phone: string;
  vehicleModel: string;
  complaint: string;
  diagnosis: string;
  aiDiagnosis?: string;
  entryTime: string;
  status: QueueStatus;
  mechanicId?: string;
  weight?: ServiceWeight;
  partsUsed: { itemId: string; name: string; qty: number; price: number }[];
  serviceCost: number;
  totalCost: number;
  notes?: string;
  estimatedFinish?: string;
  // History specific fields (optional in active queue, required in history)
  finishTime?: string;
  paymentMethod?: PaymentMethod;
  mechanicRating?: number; // 1-5
  workshopId?: string; // Multi-tenant
}

export interface ServiceReminder {
  id: string;
  customerName: string;
  phone: string;
  licensePlate: string;
  vehicleModel: string;
  lastServiceDate: string;
  nextServiceDate: string;
  serviceType: string; // e.g., "Ganti Oli", "Tune Up"
  status: ReminderStatus;
  messageTemplate?: string;
  sentAt?: string;
  workshopId?: string; // Multi-tenant
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  licensePlate: string;
  vehicleModel: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  complaint: string;
  audioBase64?: string; // For recording
  aiAnalysis?: string; // Result from Gemini after admin approval
  status: BookingStatus;
  mechanicId?: string; // Assigned mechanic
  paymentMethod?: PaymentMethod;
  transferProofBase64?: string; // For bank transfer proof
  paymentAmount?: number;
  createdAt: string;
  workshopId?: string; // Multi-tenant: which workshop this booking belongs to
  workshopSlug?: string; // URL slug of the workshop
}

export interface ViewState {
  currentView: 'LOGIN' | 'DASHBOARD' | 'FRONT_OFFICE' | 'QUEUE' | 'MECHANIC' | 'CASHIER' | 'CRM' | 'FINANCE' | 'LOGS' | 'HISTORY' | 'REMINDER' | 'GUEST_BOOKING' | 'GUEST_TRACKING' | 'BOOKING_ADMIN' | 'USERS' | 'MOOTA_SETTINGS' | 'WORKSHOP_SETTINGS';
}

export interface TimeSlot {
  id: string;
  workshopId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string;
  endTime: string;
  maxBookings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}