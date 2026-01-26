
import { InventoryItem, Role, ServiceRecord, User, QueueStatus, ServiceWeight, PaymentMethod, ReminderStatus, ServiceReminder, BookingRecord, BookingStatus } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Budi Owner', username: 'owner', password: '123', role: Role.OWNER, avatar: 'https://picsum.photos/100/100', status: 'ACTIVE' },
  { id: 'u2', name: 'Siti Admin', username: 'admin', password: '123', role: Role.ADMIN, avatar: 'https://picsum.photos/101/101', status: 'ACTIVE' },
  { id: 'u3', name: 'Joko Mekanik', username: 'mekanik1', password: '123', role: Role.MEKANIK, avatar: 'https://picsum.photos/102/102', status: 'ACTIVE', specialization: 'Mesin', performanceScore: 4.8 },
  { id: 'u4', name: 'Rudi Mekanik', username: 'mekanik2', password: '123', role: Role.MEKANIK, avatar: 'https://picsum.photos/103/103', status: 'ACTIVE', specialization: 'Kelistrikan', performanceScore: 4.5 },
  { id: 'u5', name: 'Dewi Kasir', username: 'kasir', password: '123', role: Role.KASIR, avatar: 'https://picsum.photos/104/104', status: 'ACTIVE' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'p1', name: 'Oli Mesin 10W-40', stock: 15, minStock: 20, price: 55000, category: 'Oli', unit: 'Botol' },
  { id: 'p2', name: 'Kampas Rem Depan', stock: 8, minStock: 10, price: 45000, category: 'Sparepart', unit: 'Set' },
  { id: 'p3', name: 'Busi Iridium', stock: 45, minStock: 30, price: 35000, category: 'Sparepart', unit: 'Pcs' },
  { id: 'p4', name: 'Filter Udara', stock: 5, minStock: 10, price: 40000, category: 'Sparepart', unit: 'Pcs' },
  { id: 'p5', name: 'Ban Luar 90/90-14', stock: 12, minStock: 15, price: 180000, category: 'Ban', unit: 'Pcs' },
];

export const INITIAL_QUEUE: ServiceRecord[] = [
  {
    id: 's1',
    ticketNumber: 'A-001',
    licensePlate: 'B 1234 XYZ',
    customerName: 'Ahmad',
    phone: '08123456789',
    vehicleModel: 'Honda Vario 150',
    complaint: 'Mesin bunyi kasar saat digas',
    diagnosis: 'Klep perlu diatur ulang',
    entryTime: new Date(Date.now() - 3600000).toISOString(),
    status: QueueStatus.PROCESS,
    mechanicId: 'u3',
    weight: ServiceWeight.MEDIUM,
    partsUsed: [],
    serviceCost: 75000,
    totalCost: 75000,
  },
  {
    id: 's2',
    ticketNumber: 'A-002',
    licensePlate: 'D 5678 ABC',
    customerName: 'Sarah',
    phone: '08987654321',
    vehicleModel: 'Yamaha NMAX',
    complaint: 'Rem belakang tidak pakem',
    diagnosis: 'Kampas rem habis',
    entryTime: new Date(Date.now() - 1800000).toISOString(),
    status: QueueStatus.WAITING,
    mechanicId: undefined,
    partsUsed: [],
    serviceCost: 0,
    totalCost: 0,
  },
  {
    id: 's3',
    ticketNumber: 'A-003',
    licensePlate: 'B 9999 GHJ',
    customerName: 'Doni',
    phone: '08111222333',
    vehicleModel: 'Honda Beat',
    complaint: 'Ganti oli rutin',
    diagnosis: 'Ganti oli mesin + gardan',
    entryTime: new Date(Date.now() - 900000).toISOString(),
    status: QueueStatus.FINISHED,
    mechanicId: 'u4',
    weight: ServiceWeight.LIGHT,
    partsUsed: [
        { itemId: 'p1', name: 'Oli Mesin 10W-40', qty: 1, price: 55000 }
    ],
    serviceCost: 20000,
    totalCost: 75000,
  }
];

export const INITIAL_HISTORY: ServiceRecord[] = [
  {
    id: 'h1',
    ticketNumber: 'H-098',
    licensePlate: 'B 6666 KKL',
    customerName: 'Bambang',
    phone: '08123123123',
    vehicleModel: 'Toyota Avanza',
    complaint: 'AC tidak dingin',
    diagnosis: 'Freon habis & filter kotor',
    aiDiagnosis: 'Indikasi kebocoran freon atau kompresor lemah',
    entryTime: new Date(Date.now() - 86400000 * 32).toISOString(), // 32 days ago
    finishTime: new Date(Date.now() - 86400000 * 32 + 7200000).toISOString(),
    status: QueueStatus.PAID,
    mechanicId: 'u3',
    weight: ServiceWeight.MEDIUM,
    partsUsed: [
      { itemId: 'p99', name: 'Freon R124a', qty: 1, price: 150000 },
      { itemId: 'p4', name: 'Filter Udara Cabin', qty: 1, price: 85000 }
    ],
    serviceCost: 200000,
    totalCost: 435000,
    paymentMethod: PaymentMethod.QRIS,
    mechanicRating: 5,
    notes: 'Pelanggan puas'
  },
  {
    id: 'h2',
    ticketNumber: 'H-099',
    licensePlate: 'D 2222 XX',
    customerName: 'Lina',
    phone: '08555555555',
    vehicleModel: 'Honda Scoopy',
    complaint: 'Ban bocor halus',
    diagnosis: 'Ganti ban dalam',
    aiDiagnosis: 'Tidak ada',
    entryTime: new Date(Date.now() - 86400000).toISOString(),
    finishTime: new Date(Date.now() - 86400000 + 1800000).toISOString(),
    status: QueueStatus.PAID,
    mechanicId: 'u4',
    weight: ServiceWeight.LIGHT,
    partsUsed: [
      { itemId: 'p88', name: 'Ban Dalam R12', qty: 1, price: 45000 }
    ],
    serviceCost: 25000,
    totalCost: 70000,
    paymentMethod: PaymentMethod.CASH,
    mechanicRating: 4
  },
  {
    id: 'h3',
    ticketNumber: 'H-100',
    licensePlate: 'F 3333 YY',
    customerName: 'Rian',
    phone: '08777777777',
    vehicleModel: 'Yamaha Aerox',
    complaint: 'Upgrade CVT',
    diagnosis: 'Ganti Roller & Per CVT',
    entryTime: new Date(Date.now() - 43200000).toISOString(),
    finishTime: new Date(Date.now() - 43200000 + 3600000).toISOString(),
    status: QueueStatus.VOID,
    mechanicId: 'u3',
    weight: ServiceWeight.MEDIUM,
    partsUsed: [],
    serviceCost: 0,
    totalCost: 0,
    notes: 'Dibatalkan pelanggan karena sparepart racing kosong'
  }
];

export const INITIAL_REMINDERS: ServiceReminder[] = [
  {
    id: 'r1',
    customerName: 'Bambang',
    phone: '08123123123',
    licensePlate: 'B 6666 KKL',
    vehicleModel: 'Toyota Avanza',
    lastServiceDate: new Date(Date.now() - 86400000 * 32).toISOString(), // 32 days ago
    nextServiceDate: new Date(Date.now() - 86400000 * 2).toISOString(), // Due 2 days ago (Overdue)
    serviceType: 'AC Maintenance Rutin',
    status: ReminderStatus.PENDING,
    messageTemplate: ''
  },
  {
    id: 'r2',
    customerName: 'Lina',
    phone: '08555555555',
    licensePlate: 'D 2222 XX',
    vehicleModel: 'Honda Scoopy',
    lastServiceDate: new Date(Date.now() - 86400000 * 20).toISOString(), 
    nextServiceDate: new Date(Date.now() + 86400000 * 10).toISOString(), // Due in 10 days
    serviceType: 'Ganti Oli Mesin',
    status: ReminderStatus.PENDING,
    messageTemplate: ''
  }
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'b1',
    bookingCode: 'BK-777',
    customerName: 'Kevin Guest',
    phone: '0899999111',
    licensePlate: 'B 4545 JK',
    vehicleModel: 'Yamaha XMAX',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    bookingTime: '10:00',
    complaint: 'Suara tek-tek di bagian CVT saat langsam',
    status: BookingStatus.PENDING,
    createdAt: new Date().toISOString()
  }
];