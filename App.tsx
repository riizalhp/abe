import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

import { Role, User, ServiceRecord, QueueStatus, ServiceReminder, BookingRecord, BookingStatus, ServiceWeight } from './types';
import { SecurityUtils } from './lib/security';
import { WorkshopProvider, useWorkshop } from './lib/WorkshopContext';
import { userService } from './services/userService';
import { serviceRecordService } from './services/serviceRecordService';
import { bookingService } from './services/bookingService';
import { reminderService } from './services/reminderService';
import ErrorBoundary from './src/components/ErrorBoundary';
import ProtectedRoute, { ROLE_PERMISSIONS } from './src/components/ProtectedRoute';

// Layouts & Pages
import MainLayout from './src/layouts/MainLayout';
import LandingPage from './src/pages/LandingPage';
import LoginPage from './src/pages/LoginPage';
import RegisterPage from './src/pages/RegisterPage';
import Dashboard from './src/pages/Dashboard';
import FrontOffice from './src/pages/FrontOffice';
import MechanicWorkbench from './src/pages/MechanicWorkbench';
import History from './src/pages/History';
import CRM from './src/pages/CRM';
import Bookings from './src/pages/Bookings';
import Staff from './src/pages/Staff';
import Queue from './src/pages/Queue';
import { QRISSettings } from './src/pages/QRISSettings';
import { TimeSlotSettings } from './src/pages/TimeSlotSettings';
import URLSettings from './src/pages/URLSettings';
import MootaSettingsPage from './src/pages/MootaSettings';
import WorkshopSettings from './src/pages/WorkshopSettings';
import JoinWorkshop from './src/pages/JoinWorkshop';

import GuestBooking from './src/pages/GuestBooking';
import GuestTracking from './src/pages/GuestTracking';

// Inner App component that uses the context
function AppContent() {
  const { currentUser, isAuthenticated, isLoading, logout } = useWorkshop();
  const [users, setUsers] = useState<User[]>([]);
  const [queue, setQueue] = useState<ServiceRecord[]>([]);
  const [history, setHistory] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);

  // Guest Interaction State
  const [activeTrackingCode, setActiveTrackingCode] = useState('');

  const refreshData = useCallback(async () => {
    // Only fetch data if user is authenticated
    if (!isAuthenticated) {
      setUsers([]);
      setQueue([]);
      setHistory([]);
      setBookings([]);
      setReminders([]);
      return;
    }
    
    try {
      const [u, q, h, b, r] = await Promise.all([
        userService.getAll(),
        serviceRecordService.getQueue(),
        serviceRecordService.getHistory(),
        bookingService.getAll(),
        reminderService.getAll()
      ]);
      setUsers(u);
      setQueue(q.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()));
      setHistory(h.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()));
      setBookings(b);
      setReminders(r);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, [isAuthenticated]);

  // Refresh data when user logs in/out
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleLogout = () => {
    logout();
  };

  const handleAddUser = async (user: Partial<User>) => {
    try {
      console.log('Creating user with data:', user);
      
      // Sanitize user input
      const sanitizedUser = {
        ...user,
        name: SecurityUtils.sanitizeInput(user.name || ''),
        email: SecurityUtils.sanitizeInput(user.email || ''),
        specialization: user.specialization ? SecurityUtils.sanitizeInput(user.specialization) : undefined,
        role: user.role || Role.MEKANIK,
        avatar: user.avatar || '',
      };
      
      const newUser = await userService.create({
        ...sanitizedUser,
        status: 'ACTIVE',
        username: user.username || `user${Date.now()}`,
        password: user.password || '123'
      });
      console.log('User created successfully:', newUser);
      setUsers([...users, newUser]);
    } catch (e) {
      console.error('User creation failed:', e);
      alert(`Failed to create user: ${e.message || 'Unknown error'}. Check console for details.`);
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
      // Navigate to tracking with workshop slug if available
      if (workshops.length > 0) {
        navigate(`/tracking/${workshops[0].slug}`);
      } else {
        navigate('/tracking/default-workshop');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit booking");
    }
  };

  // Dashboard Stats (Calculated from real data)
  const dashboardStats = (() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate today's revenue
    const revenueToday = history
      .filter(h => h.finishTime && new Date(h.finishTime).toDateString() === today.toDateString())
      .reduce((sum, h) => sum + (h.totalCost || 0), 0);

    // Calculate yesterday's revenue for growth comparison
    const revenueYesterday = history
      .filter(h => h.finishTime && new Date(h.finishTime).toDateString() === yesterday.toDateString())
      .reduce((sum, h) => sum + (h.totalCost || 0), 0);

    // Calculate growth percentage
    const growthPercentage = revenueYesterday > 0 
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 
      : revenueToday > 0 ? 100 : 0;

    return {
      revenue: history.reduce((acc, curr) => {
        // Filter for today only
        if (curr.finishTime && new Date(curr.finishTime).toDateString() === today.toDateString()) {
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
        revenueToday,
        vehiclesToday:
          history.filter(h => h.entryTime && new Date(h.entryTime).toDateString() === today.toDateString()).length +
          queue.filter(q => q.entryTime && new Date(q.entryTime).toDateString() === today.toDateString()).length,
        rating: history.length > 0 ? history.reduce((sum, h) => sum + (h.mechanicRating || 0), 0) / history.length : 0
      },
      growth: growthPercentage
    };
  })();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
        <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<LandingPageWrapper />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginWrapper /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />}
        />
        {/* Guest Booking Routes - supports both default and per-workshop */}
        <Route
          path="/booking/new"
          element={<GuestBookingWrapper onSubmit={handleGuestBookingSubmit} />}
        />
        <Route
          path="/booking/:workshopSlug"
          element={<GuestBookingWrapper onSubmit={handleGuestBookingSubmit} />}
        />
        <Route
          path="/tracking/:workshopSlug"
          element={<GuestTrackingWrapper bookings={bookings} initialCode={activeTrackingCode} setCode={setActiveTrackingCode} />}
        />
        {/* Join Workshop via Invitation */}
        <Route
          path="/join/:inviteCode"
          element={<JoinWorkshop />}
        />

        {/* Protected Routes */}
        <Route element={isAuthenticated ? <MainLayout currentUser={currentUser!} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={
            <Dashboard stats={dashboardStats} />
          } />
          <Route path="/front-office" element={
            <FrontOffice onAddQueue={addQueue} />
          } />
          <Route path="/mechanic-workbench" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.OPERATIONS}>
              <MechanicWorkbench queue={queue} updateStatus={updateQueueStatus} bookings={bookings} setBookings={setBookings} />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <History history={history} currentUser={currentUser!} onVoid={handleVoidHistory} />
          } />
          <Route path="/crm" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <CRM history={history} reminders={reminders} setReminders={setReminders} />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <Bookings bookings={bookings} setBookings={setBookings} onAddToQueue={addQueue} />
          } />
          <Route path="/staff" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <Staff users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
            </ProtectedRoute>
          } />
          <Route path="/qris-settings" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <QRISSettings />
            </ProtectedRoute>
          } />
          <Route path="/time-slot-settings" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <TimeSlotSettings />
            </ProtectedRoute>
          } />
          <Route path="/url-settings" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <URLSettings />
            </ProtectedRoute>
          } />
          <Route path="/moota-settings" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={ROLE_PERMISSIONS.MANAGEMENT}>
              <MootaSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/workshop-settings" element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={[Role.OWNER]}>
              <WorkshopSettings currentUser={currentUser!} />
            </ProtectedRoute>
          } />
          <Route path="/queue" element={<Queue queue={queue} updateStatus={updateQueueStatus} />} />

          {/* Fallback for under construction */}
          <Route path="/cashier" element={<UnderConstruction />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

// Main App wrapper with providers
function App() {
  return (
    <Router>
      <WorkshopProvider>
        <AppContent />
      </WorkshopProvider>
    </Router>
  );
}

// Helper Wrappers to handle Navigation props
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return <LandingPage onLoginClick={() => navigate('/login')} onGuestBooking={() => navigate('/booking/new')} onGuestTracking={() => navigate('/tracking/default-workshop')} />;
};

const LoginWrapper = () => {
  const navigate = useNavigate();
  return <LoginPage onBack={() => navigate('/')} />;
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
