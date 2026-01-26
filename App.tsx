import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

import { Role, User, InventoryItem, ServiceRecord, QueueStatus, ServiceReminder, BookingRecord, BookingStatus, ServiceWeight } from './types';
import { userService } from './services/userService';
import { inventoryService } from './services/inventoryService';
import { serviceRecordService } from './services/serviceRecordService';
import { bookingService } from './services/bookingService';
import { reminderService } from './services/reminderService';

// Layouts & Pages
import MainLayout from './src/layouts/MainLayout';
import LandingPage from './src/pages/LandingPage';
import LoginPage from './src/pages/LoginPage';
import Dashboard from './src/pages/Dashboard';
import FrontOffice from './src/pages/FrontOffice';
import MechanicWorkbench from './src/pages/MechanicWorkbench';
import InventoryView from './src/pages/Inventory';
import History from './src/pages/History';
import CRM from './src/pages/CRM';
import Bookings from './src/pages/Bookings';
import Staff from './src/pages/Staff';

import GuestBooking from './src/pages/GuestBooking';
import GuestTracking from './src/pages/GuestTracking';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [queue, setQueue] = useState<ServiceRecord[]>([]);
  const [history, setHistory] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);

  // Guest Interaction State
  const [activeTrackingCode, setActiveTrackingCode] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const [u, i, q, h, b, r] = await Promise.all([
        userService.getAll(),
        inventoryService.getAll(),
        serviceRecordService.getQueue(),
        serviceRecordService.getHistory(),
        bookingService.getAll(),
        reminderService.getAll()
      ]);
      setUsers(u);
      setInventory(i);
      setQueue(q.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()));
      setHistory(h.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()));
      setBookings(b);
      setReminders(r);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Navigation is handled by the component wrapper via Navigate or useNavigate
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddUser = async (user: Partial<User>) => {
    try {
      const newUser = await userService.create({
        ...user,
        role: user.role || Role.MEKANIK,
        avatar: user.avatar || '',
        specialization: user.specialization,
        status: 'ACTIVE',
        performanceScore: user.role === Role.MEKANIK ? 5.0 : undefined,
        username: user.username || `user${Date.now()}`,
        password: user.password || '123'
      });
      setUsers([...users, newUser]);
    } catch (e) {
      console.error(e);
      alert("Failed to create user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove this account?')) {
      try {
        await userService.delete(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (e) {
        console.error(e);
        alert("Failed to delete user");
      }
    }
  };

  const addQueue = async (data: Partial<ServiceRecord>) => {
    try {
      const newRecord = await serviceRecordService.create({
        ticketNumber: `A-${queue.length + 1}`.padStart(5, '0'),
        licensePlate: data.licensePlate || '',
        customerName: data.customerName || '',
        phone: data.phone || '',
        vehicleModel: data.vehicleModel || '',
        complaint: data.complaint || '',
        diagnosis: data.diagnosis || '',
        status: QueueStatus.WAITING,
        partsUsed: [],
        serviceCost: 0,
        totalCost: 0,
        ...data
      });
      setQueue([...queue, newRecord]);
      alert(`Ticket Created: ${newRecord.ticketNumber}`);
    } catch (e) {
      console.error(e);
      alert("Failed to create ticket");
    }
  };

  const updateQueueStatus = async (id: string, status: QueueStatus) => {
    try {
      if (status === QueueStatus.FINISHED) {
        const item = queue.find(q => q.id === id);
        if (item) {
          await serviceRecordService.update(id, {
            status: QueueStatus.FINISHED,
            finishTime: new Date().toISOString(),
            serviceCost: 50000, // Default base cost
            totalCost: 50000,
            weight: ServiceWeight.LIGHT
          });
          refreshData();
        }
      } else {
        await serviceRecordService.update(id, { status });
        setQueue(queue.map(q => q.id === id ? { ...q, status } : q));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVoidHistory = async (id: string, reason: string) => {
    try {
      await serviceRecordService.update(id, { status: QueueStatus.VOID, notes: `VOID: ${reason}` });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuestBookingSubmit = async (data: any, navigate: any) => {
    try {
      const newBooking = await bookingService.create({
        bookingCode: `BK-${Math.floor(Math.random() * 10000)}`,
        customerName: data.customerName,
        phone: data.phone,
        licensePlate: data.licensePlate,
        vehicleModel: data.vehicleModel,
        bookingDate: data.bookingDate,
        bookingTime: data.bookingTime,
        complaint: data.complaint,
        audioBase64: data.audioBase64,
        status: BookingStatus.PENDING
      });
      setBookings([...bookings, newBooking]);
      setActiveTrackingCode(newBooking.bookingCode);
      navigate('/tracking');
    } catch (e) {
      console.error(e);
      alert("Failed to submit booking");
    }
  };

  // Dashboard Stats (Calculated from real data)
  const dashboardStats = {
    revenue: history.reduce((acc, curr) => {
      // Filter for today only
      if (curr.finishTime && new Date(curr.finishTime).toDateString() === new Date().toDateString()) {
        const hour = new Date(curr.finishTime).getHours();
        const timeKey = `${hour.toString().padStart(2, '0')}:00`;
        const existing = acc.find(a => a.time === timeKey);
        if (existing) {
          existing.amount += (curr.totalCost || 0);
        } else {
          acc.push({ time: timeKey, amount: (curr.totalCost || 0) });
        }
      }
      return acc;
    }, [] as { time: string, amount: number }[]).sort((a, b) => a.time.localeCompare(b.time)),
    status: [
      { name: 'Finished', value: history.filter(q => q.status === QueueStatus.FINISHED).length },
      { name: 'Working', value: queue.filter(q => q.status === QueueStatus.PROCESS).length },
      { name: 'Waiting', value: queue.filter(q => q.status === QueueStatus.WAITING).length },
      { name: 'Pending', value: bookings.filter(b => b.status === BookingStatus.PENDING).length },
    ],
    summary: {
      revenueToday: history
        .filter(h => h.finishTime && new Date(h.finishTime).toDateString() === new Date().toDateString())
        .reduce((sum, h) => sum + (h.totalCost || 0), 0),
      vehiclesToday:
        history.filter(h => h.entryTime && new Date(h.entryTime).toDateString() === new Date().toDateString()).length +
        queue.filter(q => q.entryTime && new Date(q.entryTime).toDateString() === new Date().toDateString()).length,
      rating: history.length > 0 ? history.reduce((sum, h) => sum + (h.mechanicRating || 0), 0) / history.length : 0
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<LandingPageWrapper />}
        />
        <Route
          path="/login"
          element={!currentUser ? <LoginWrapper onLogin={handleLogin} users={users} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/booking/new"
          element={<GuestBookingWrapper onSubmit={handleGuestBookingSubmit} />}
        />
        <Route
          path="/tracking"
          element={<GuestTrackingWrapper bookings={bookings} initialCode={activeTrackingCode} setCode={setActiveTrackingCode} />}
        />

        {/* Protected Routes */}
        <Route element={currentUser ? <MainLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard stats={dashboardStats} inventory={inventory} />} />
          <Route path="/front-office" element={<FrontOffice onAddQueue={addQueue} />} />
          <Route path="/mechanic" element={<MechanicWorkbench queue={queue} updateStatus={updateQueueStatus} bookings={bookings} setBookings={setBookings} />} />
          <Route path="/inventory" element={<InventoryView inventory={inventory} onRefresh={refreshData} />} />
          <Route path="/history" element={<History history={history} currentUser={currentUser!} onVoid={handleVoidHistory} />} />
          <Route path="/crm" element={<CRM history={history} reminders={reminders} setReminders={setReminders} />} />
          <Route path="/bookings" element={<Bookings bookings={bookings} setBookings={setBookings} onAddToQueue={addQueue} />} />
          <Route path="/staff" element={<Staff users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />} />


          {/* Fallback for under construction */}
          <Route path="/cashier" element={<UnderConstruction />} />
        </Route>
      </Routes>
    </Router>
  );
}

// Helper Wrappers to handle Navigation props
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return <LandingPage onLoginClick={() => navigate('/login')} onGuestBooking={() => navigate('/booking/new')} onGuestTracking={() => navigate('/tracking')} />;
};

const LoginWrapper = ({ onLogin, users }: { onLogin: (u: User) => void, users: User[] }) => {
  const navigate = useNavigate();
  return <LoginPage onLogin={onLogin} onBack={() => navigate('/')} users={users} />;
};

const GuestBookingWrapper = ({ onSubmit }: { onSubmit: (data: any, nav: any) => void }) => {
  const navigate = useNavigate();
  return <GuestBooking onSubmit={(data) => onSubmit(data, navigate)} onBack={() => navigate('/')} />;
};

const GuestTrackingWrapper = ({ bookings, initialCode, setCode }: { bookings: BookingRecord[], initialCode: string, setCode: (c: string) => void }) => {
  const navigate = useNavigate();
  return <GuestTracking bookings={bookings} initialCode={initialCode} onBack={() => { setCode(''); navigate('/'); }} />;
};

const UnderConstruction = () => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
    <div className="bg-slate-50 p-6 rounded-full mb-6">
      <Settings className="w-12 h-12 text-slate-300" />
    </div>
    <h3 className="text-xl font-bold text-slate-900">Module Under Construction</h3>
    <p className="text-slate-500 mt-2">This feature will be available in the next update.</p>
  </div>
);

export default App;
