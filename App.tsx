
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, Wrench, FileText, ShoppingCart, BarChart3, Settings,
  LogOut, Mic, Camera, Upload, CheckCircle, AlertCircle, Clock,
  DollarSign, Plus, Trash2, Save, Search, Printer, Calendar,
  History, Filter, X, Eye, MessageSquare, Send, Bell, CalendarClock,
  PlayCircle, StopCircle, Bot, BookOpen, ChevronLeft, CreditCard,
  FileAudio, Check, UserCheck, ArrowRight, Star, Cpu, ShieldCheck,
  Gauge, Activity, LayoutDashboard, XCircle, CheckSquare, ArrowUpRight,
  UserPlus, UserMinus, Shield, Briefcase, Lock, User as UserIcon
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';

import { Role, User, ViewState, InventoryItem, ServiceRecord, QueueStatus, ServiceWeight, PaymentMethod, ServiceReminder, ReminderStatus, BookingRecord, BookingStatus } from './types';
import { analyzeAudioDiagnosis, scanInvoiceOCR, predictServiceSchedule, generateMarketingMessage, analyzeBookingWithAudio } from './services/geminiService';
import { userService } from './services/userService';
import { inventoryService } from './services/inventoryService';
import { serviceRecordService } from './services/serviceRecordService';
import { bookingService } from './services/bookingService';
import { reminderService } from './services/reminderService';

// --- Components ---

const LandingPage = ({ onLoginClick, onGuestBooking, onGuestTracking }: { onLoginClick: () => void, onGuestBooking: () => void, onGuestTracking: () => void }) => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation - Glassmorphism */}
      <nav className="fixed w-full bg-slate-900/90 backdrop-blur-md z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-glow">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">ABE<span className="text-blue-500">.AUTO</span></span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={onGuestTracking}
                className="text-slate-300 hover:text-white font-medium text-sm hidden md:block transition-colors"
              >
                Track Order
              </button>
              <button
                onClick={onLoginClick}
                className="bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-slate-900 transition-all font-medium text-sm"
              >
                Staff Access
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark Automotive Theme */}
      <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden bg-slate-900 text-white">
        {/* Abstract Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="lg:w-2/3">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-6">
              <Bot className="w-3 h-3 mr-2" /> Powered by Gemini 2.0 AI
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Automotive Care</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-400 mb-10 leading-relaxed">
              Experience the next generation of workshop management.
              Real-time diagnostics, audio analysis engine, and predictive maintenance in one seamless platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGuestBooking}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 shadow-lg shadow-blue-900/50 flex items-center justify-center transition-all hover:scale-[1.02]"
              >
                <CalendarClock className="mr-2 h-5 w-5" /> Book Service
              </button>
              <button
                onClick={onGuestTracking}
                className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-lg hover:bg-slate-700 flex items-center justify-center transition-all"
              >
                <Search className="mr-2 h-5 w-5" /> Check Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - Minimalist Cards */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Precision Engineering</h2>
            <p className="text-slate-500 mt-2">Designed for modern workshops</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Cpu, title: 'AI Diagnostics', desc: 'Acoustic analysis engine detects engine faults from audio recordings.', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Gauge, title: 'Real-time Metrics', desc: 'Live operational dashboard tracking revenue, queue, and inventory.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: MessageSquare, title: 'Smart CRM', desc: 'Automated WhatsApp reminders based on predictive service intervals.', color: 'text-teal-600', bg: 'bg-teal-50' },
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center mb-6 opacity-50 grayscale hover:grayscale-0 transition-all">
            <Wrench className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">ABE.AUTO</span>
          </div>
          <p className="text-sm opacity-50">© 2025 ABE System. Built for speed.</p>
        </div>
      </footer>
    </div>
  );
};

const LoginForm = ({ onLogin, onBack, users }: { onLogin: (user: User) => void, onBack: () => void, users: User[] }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Ambient Backgound */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
      <div className="absolute -left-20 top-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]"></div>

      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-16 h-16 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Wrench className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Login</h1>
          <p className="text-slate-400 mt-2 text-sm">Enter credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-500/30 transition-all flex items-center justify-center mt-2">
            Sign In <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-500">Default: owner / 123</p>
          </div>
        </form>

      </div>
    </div>
  );
};

const UserManagementView = ({ users, onAddUser, onDeleteUser }: { users: User[], onAddUser: (user: Partial<User>) => void, onDeleteUser: (id: string) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: Role.MEKANIK,
    specialization: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      ...newUser,
      avatar: `https://picsum.photos/seed/${newUser.name}-${Date.now()}/200/200`
    });
    setNewUser({ name: '', username: '', password: '', role: Role.MEKANIK, specialization: '' });
    setIsModalOpen(false);
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.OWNER: return 'bg-purple-100 text-purple-700 border-purple-200';
      case Role.ADMIN: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Role.MEKANIK: return 'bg-slate-100 text-slate-700 border-slate-200';
      case Role.KASIR: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h2>
          <p className="text-slate-500 text-sm">Manage accounts and role assignments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center transition-all font-bold text-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Staff</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Mechanics</p>
          <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === Role.MEKANIK).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Active Now</p>
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'ACTIVE').length}</p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRoleColor(user.role)}`}>
                {user.role}
              </div>
              {user.role !== Role.OWNER && (
                <button onClick={() => onDeleteUser(user.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                {user.specialization && (
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <Wrench className="w-3 h-3 mr-1" /> {user.specialization}
                  </p>
                )}
                {!user.specialization && <p className="text-sm text-slate-400 italic mt-1">General Staff</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
              <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <span className="text-xs font-bold text-slate-500 uppercase">{user.status || 'OFFLINE'}</span>
              {user.performanceScore && (
                <div className="ml-auto flex items-center text-amber-500 font-bold text-sm">
                  <Star className="w-3 h-3 mr-1 fill-amber-500" />
                  {user.performanceScore}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Add New Staff</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="User123"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="****"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role Assignment</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Role)
                    .filter(role => role !== Role.OWNER)
                    .map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewUser({ ...newUser, role })}
                        className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all ${newUser.role === role
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                </div>
              </div>

              {newUser.role === Role.MEKANIK && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Specialization</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Engine, Electric, CVT"
                    value={newUser.specialization}
                    onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const GuestTrackingView = ({ bookings, onBack, initialCode }: { bookings: BookingRecord[], onBack: () => void, initialCode?: string }) => {
  const [searchCode, setSearchCode] = useState(initialCode || '');
  const [foundBooking, setFoundBooking] = useState<BookingRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(!!initialCode);

  useEffect(() => {
    if (initialCode) {
      const booking = bookings.find(b => b.bookingCode === initialCode);
      if (booking) {
        setFoundBooking(booking);
        setSearched(true);
        setShowSuccess(true);
      }
    }
  }, [initialCode, bookings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);
    const booking = bookings.find(b => b.bookingCode === searchCode.trim().toUpperCase());
    setFoundBooking(booking || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pt-20">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center mb-8 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
        </button>

        {showSuccess && (
          <div className="mb-6 bg-emerald-500 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-start animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white/20 p-2 rounded-full mr-4 mt-0.5">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Booking Successful!</h3>
              <p className="text-white/90 text-sm mt-1">Your ticket <span className="font-mono font-bold bg-white/20 px-1 rounded">{initialCode}</span> has been generated. Use this code to track your service status.</p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center justify-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" /> Track Service
        </h2>

        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 mb-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Booking Code</label>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="BK-XXXX"
                className="w-full p-4 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50"
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              Track Status
            </button>
          </form>
        </div>

        {searched && !foundBooking && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100 text-sm font-medium">
            Booking <span className="font-mono font-bold">{searchCode}</span> not found.
          </div>
        )}

        {foundBooking && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-4">
            <div className={`p-4 text-white text-center font-bold tracking-wider text-sm ${foundBooking.status === BookingStatus.CONFIRMED ? 'bg-green-600' :
              foundBooking.status === BookingStatus.REJECTED ? 'bg-red-600' :
                'bg-amber-500'
              }`}>
              {foundBooking.status === BookingStatus.PENDING ? 'WAITING APPROVAL' : foundBooking.status}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Owner</p>
                  <p className="font-semibold text-slate-900 text-lg">{foundBooking.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Schedule</p>
                  <p className="font-semibold text-slate-900">{foundBooking.bookingDate}</p>
                  <p className="font-mono text-xs text-slate-500">{foundBooking.bookingTime}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Vehicle</p>
                  <p className="font-semibold text-slate-900">{foundBooking.licensePlate}</p>
                  <p className="text-xs text-slate-500">{foundBooking.vehicleModel}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-2">Complaint Note</p>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100">"{foundBooking.complaint}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GuestBookingForm = ({ onSubmit, onBack }: { onSubmit: (data: any) => void, onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    licensePlate: '',
    vehicleModel: '',
    bookingDate: '',
    bookingTime: '',
    complaint: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioFileName('Engine_Audio_Sample.wav');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error", err);
      alert("No mic access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioFileName(file.name);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      setStep(3);
    }, 1000);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let audioBase64 = '';
    if (audioBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      await new Promise(resolve => {
        reader.onloadend = () => {
          audioBase64 = reader.result?.toString().split(',')[1] || '';
          resolve(null);
        };
      });
    }
    onSubmit({ ...formData, audioBase64 });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[600px] border border-slate-100">

        {/* Header */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-2xl font-bold tracking-tight">Book Service</h2>
            <button onClick={onBack} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Minimalist Stepper */}
          <div className="flex items-center gap-4 relative z-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${step >= i
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-transparent border-slate-600 text-slate-500'
                  }`}>
                  {step > i ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 3 && <div className={`h-0.5 flex-1 mx-4 transition-all duration-500 ${step > i ? 'bg-blue-600' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 flex-1 bg-white">
          {/* STEP 1: Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="customerName" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.customerName} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">WhatsApp</label>
                  <input type="tel" name="phone" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.phone} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">License Plate</label>
                  <input type="text" name="licensePlate" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none uppercase font-mono" onChange={handleInputChange} value={formData.licensePlate} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Model</label>
                  <input type="text" name="vehicleModel" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.vehicleModel} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                  <input type="date" name="bookingDate" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.bookingDate} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time</label>
                  <input type="time" name="bookingTime" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.bookingTime} />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <div className="text-center space-y-8 animate-in slide-in-from-right duration-300 py-10">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <CreditCard className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Booking Deposit</h3>
                <p className="text-slate-500 mt-2">Secure your slot with a standard fee.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto">
                <div className="flex justify-between font-bold text-2xl text-slate-900">
                  <span>Total</span>
                  <span>Rp 10.000</span>
                </div>
              </div>

              <button
                onClick={handlePaymentSuccess}
                className="w-full max-w-sm bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center mx-auto"
              >
                <CreditCard className="w-5 h-5 mr-3" /> Simulate Payment
              </button>
            </div>
          )}

          {/* STEP 3: Diagnostics */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg flex items-center text-sm font-medium">
                <CheckCircle className="w-5 h-5 mr-3" />
                Payment Successful. Please provide vehicle details.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Details & Symptoms</label>
                <textarea name="complaint" rows={3} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Describe the issue..." onChange={handleInputChange} value={formData.complaint}></textarea>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <div className="bg-blue-100 p-1.5 rounded mr-3">
                    <Cpu className="w-4 h-4 text-blue-600" />
                  </div>
                  AI Acoustic Input
                </h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    {isRecording ? (
                      <button type="button" onClick={stopRecording} className="w-full py-6 border-2 border-red-100 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex flex-col items-center justify-center animate-pulse">
                        <StopCircle className="w-8 h-8 mb-2" /> <span className="text-xs font-bold uppercase">Stop</span>
                      </button>
                    ) : (
                      <button type="button" onClick={startRecording} className="w-full py-6 border-2 border-slate-200 bg-white text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all flex flex-col items-center justify-center group">
                        <Mic className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold uppercase">Record Engine</span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-full py-6 border-2 border-slate-200 bg-white text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold uppercase">Upload Audio</span>
                    </div>
                  </div>
                </div>

                {audioBlob && (
                  <div className="mt-4 flex items-center text-green-700 text-sm bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                    <div className="bg-green-100 p-1 rounded mr-3">
                      <FileAudio className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 font-medium">{audioFileName || 'Audio Captured'}</span>
                    <Check className="w-4 h-4 ml-2" />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                Confirm Booking
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({
  stats,
  inventory
}: {
  stats: { revenue: any[], status: any[] },
  inventory: InventoryItem[]
}) => {
  const lowStock = inventory.filter(i => i.stock <= i.minStock);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Revenue Today', val: 'Rp 2.5jt', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Vehicles In', val: '12 Units', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Critical Stock', val: `${lowStock.length} Items`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Efficiency', val: '94%', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">TODAY</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{item.val}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 h-96">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Revenue Analytics</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={stats.revenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 h-96">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Queue Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={stats.status}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                cornerRadius={5}
              >
                {stats.status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#94a3b8'][index % 4]} stroke="none" />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <h3 className="text-red-900 font-bold flex items-center mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            Inventory Alerts
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-red-400 font-bold uppercase text-xs tracking-wider">
                  <th className="pb-3 pl-2">Item</th>
                  <th className="pb-3">Remaining</th>
                  <th className="pb-3">Threshold</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => (
                  <tr key={item.id} className="border-t border-red-100/50 hover:bg-red-100/30 transition-colors">
                    <td className="py-3 pl-2 font-medium text-slate-700">{item.name}</td>
                    <td className="py-3 font-bold text-red-600">{item.stock}</td>
                    <td className="py-3 text-slate-500">{item.minStock}</td>
                    <td className="py-3">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide">Restock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const FrontOffice = ({ onAddQueue }: { onAddQueue: (data: Partial<ServiceRecord>) => void }) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    customerName: '',
    phone: '',
    vehicleModel: '',
    complaint: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            setIsAnalyzing(true);
            const result = await analyzeAudioDiagnosis(base64Audio);
            setAiDiagnosis(result);
            setIsAnalyzing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddQueue({
      ...formData,
      diagnosis: aiDiagnosis || 'Pending Check',
      entryTime: new Date().toISOString(),
      status: QueueStatus.WAITING,
      partsUsed: [],
      serviceCost: 0,
      totalCost: 0
    });
    setFormData({ licensePlate: '', customerName: '', phone: '', vehicleModel: '', complaint: '' });
    setAiDiagnosis('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check-in</h2>
          <p className="text-slate-500 text-sm">Create new service ticket</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-mono font-medium tracking-wider shadow-lg shadow-slate-900/20">
          TICKET #A-{Math.floor(Math.random() * 1000)}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">License Plate</label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase font-mono font-semibold"
                placeholder="B 1234 XYZ"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vehicle Model</label>
              <input
                type="text"
                name="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Honda Vario 150"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Full Name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone (WA)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="08..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Complaint / Issue</label>
            <textarea
              name="complaint"
              value={formData.complaint}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="Describe the issue..."
              required
            ></textarea>
          </div>

          {/* AI Section */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wide">
                <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                AI Acoustic Diagnostic
              </h3>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center shadow-sm"
                >
                  <Mic className="w-3 h-3 mr-2" /> REC
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-100 flex items-center animate-pulse"
                >
                  <StopCircle className="w-3 h-3 mr-2" /> STOP
                </button>
              )}
            </div>

            {isAnalyzing && (
              <div className="text-sm text-blue-600 flex items-center font-medium bg-blue-50 p-3 rounded-lg">
                <Settings className="w-4 h-4 mr-3 animate-spin" /> Processing audio profile...
              </div>
            )}

            {!isAnalyzing && aiDiagnosis && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <span className="text-xs font-bold text-blue-600 uppercase mb-1 block">AI Analysis Result</span>
                <p className="text-slate-700 text-sm leading-relaxed">{aiDiagnosis}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20 flex items-center transition-all hover:scale-[1.02]"
            >
              <Printer className="w-5 h-5 mr-2" />
              Generate Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MechanicView = ({ queue, updateStatus, bookings, setBookings }: { queue: ServiceRecord[], updateStatus: (id: string, status: QueueStatus) => void, bookings: BookingRecord[], setBookings: any }) => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'QUEUE' | 'BOOKINGS'>('JOBS');
  const myTasks = queue.filter(q => q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING);
  const waitingTasks = queue.filter(q => q.status === QueueStatus.WAITING);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyze = async (booking: BookingRecord) => {
    if (!booking.audioBase64) return;
    setAnalyzingId(booking.id);
    const analysis = await analyzeBookingWithAudio(booking.audioBase64, booking.complaint, booking.vehicleModel);
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, aiAnalysis: analysis } : b));
    setAnalyzingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
        {[
          { id: 'JOBS', label: 'Active Jobs', icon: Wrench },
          { id: 'QUEUE', label: 'Queue', icon: Clock },
          { id: 'BOOKINGS', label: 'Online', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all flex items-center ${activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'JOBS' && (
        <section className="animate-in fade-in slide-in-from-left-4 duration-300">
          {myTasks.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No active jobs. Pick from queue.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {myTasks.map(task => (
                <div key={task.id} className="bg-white p-6 rounded-2xl shadow-card border-l-4 border-blue-600">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{task.licensePlate}</h3>
                      <p className="text-slate-500 font-medium">{task.vehicleModel}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">
                      {task.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer Issue</p>
                      <p className="text-slate-700">{task.complaint}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-400 uppercase mb-1">Diagnosis</p>
                      <p className="text-slate-700">{task.diagnosis || task.aiDiagnosis}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => updateStatus(task.id, QueueStatus.PENDING)}
                      className="flex-1 border border-amber-200 bg-amber-50 text-amber-700 py-3 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                    >
                      Pending Parts
                    </button>
                    <button
                      onClick={() => updateStatus(task.id, QueueStatus.FINISHED)}
                      className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Reusing Table Styles for Queue & Bookings */}
      {(activeTab === 'QUEUE' || activeTab === 'BOOKINGS') && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider">
                {activeTab === 'QUEUE'
                  ? <>
                    <th className="p-5">Ticket</th><th className="p-5">Vehicle</th><th className="p-5">Issue</th><th className="p-5 text-right">Action</th>
                  </>
                  : <>
                    <th className="p-5">Time</th><th className="p-5">Vehicle</th><th className="p-5">Audio Analysis</th><th className="p-5">Status</th>
                  </>
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'QUEUE' && waitingTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-mono font-bold text-slate-900">{task.ticketNumber}</td>
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{task.licensePlate}</div>
                    <div className="text-xs text-slate-500">{task.vehicleModel}</div>
                  </td>
                  <td className="p-5 text-slate-600 truncate max-w-xs">{task.complaint}</td>
                  <td className="p-5 text-right">
                    <button onClick={() => updateStatus(task.id, QueueStatus.PROCESS)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-200 transition-all">Start Job</button>
                  </td>
                </tr>
              ))}

              {activeTab === 'BOOKINGS' && bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{b.bookingTime}</div>
                    <div className="text-xs text-slate-500">{b.bookingDate}</div>
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{b.licensePlate}</div>
                    <div className="text-xs text-slate-500">{b.vehicleModel}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-slate-500 italic">"{b.complaint}"</span>
                      {b.aiAnalysis && (
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-100">
                          <Bot className="w-3 h-3 inline mr-1" /> {b.aiAnalysis.substring(0, 50)}...
                        </div>
                      )}
                      {!b.aiAnalysis && b.audioBase64 && (
                        <button onClick={() => handleAnalyze(b)} disabled={analyzingId === b.id} className="text-blue-600 text-xs font-bold hover:underline flex items-center">
                          {analyzingId === b.id ? 'Processing...' : 'Run AI Diag'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const InventoryView = ({ inventory, onRefresh }: { inventory: InventoryItem[], onRefresh: () => void }) => {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result?.toString().split(',')[1];
      if (base64Image) {
        const jsonResult = await scanInvoiceOCR(base64Image);
        try {
          const parsedItems = JSON.parse(jsonResult);
          if (Array.isArray(parsedItems)) {
            // Sequential create for now
            for (const item of parsedItems) {
              await inventoryService.create({
                name: item.name,
                stock: item.qty || 0,
                minStock: 5,
                price: item.price || 0,
                category: 'Unsorted',
                unit: 'Pcs'
              });
            }
            onRefresh();
          }
        } catch (err) {
          alert('OCR Failed. Try clearer image. ' + err);
        }
      }
      setIsScanning(false);
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-slate-500 text-sm">Stock management & Procurement</p>
        </div>
        <div className="flex space-x-3">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all flex items-center shadow-sm font-medium"
          >
            {isScanning ? <span className="animate-spin mr-2">⏳</span> : <Camera className="w-4 h-4 mr-2" />}
            AI Scan
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all flex items-center font-medium shadow-lg shadow-slate-900/20">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider">
              <th className="p-5 pl-6">Item Name</th>
              <th className="p-5">Category</th>
              <th className="p-5">Stock</th>
              <th className="p-5">Price</th>
              <th className="p-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5 pl-6 font-medium text-slate-900">{item.name}</td>
                <td className="p-5 text-slate-500">{item.category}</td>
                <td className="p-5 font-mono">{item.stock} <span className="text-slate-400 text-xs">{item.unit}</span></td>
                <td className="p-5 font-mono text-slate-700">Rp {item.price.toLocaleString()}</td>
                <td className="p-5">
                  {item.stock <= item.minStock ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      Low
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      Good
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ServiceHistoryView = ({ history, currentUser, onVoid }: { history: ServiceRecord[], currentUser: User, onVoid: (id: string, reason: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);

  const filteredHistory = history.filter(record => {
    if (currentUser.role === Role.MEKANIK && record.mechanicId !== currentUser.id) return false;
    const matchesSearch = record.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || record.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? record.entryTime.startsWith(filterDate) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Service History</h2>
          <p className="text-slate-500 text-sm">Archives & Logs</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 bg-white" />
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider">
              <th className="p-5">Date</th><th className="p-5">Plate</th><th className="p-5">Customer</th><th className="p-5 text-right">Cost</th><th className="p-5">Status</th><th className="p-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-5 text-slate-600">{new Date(r.entryTime).toLocaleDateString()}</td>
                <td className="p-5 font-mono font-bold">{r.licensePlate}</td>
                <td className="p-5">{r.customerName}</td>
                <td className="p-5 text-right font-medium">Rp {r.totalCost.toLocaleString()}</td>
                <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{r.status}</span></td>
                <td className="p-5 text-right"><button onClick={() => setSelectedRecord(r)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Service Record Details</h3>
              <button onClick={() => setSelectedRecord(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Customer</label>
                  <p className="font-semibold text-slate-900">{selectedRecord.customerName}</p>
                </div>
                <div className="text-right">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vehicle</label>
                  <p className="font-mono font-bold text-slate-900 text-lg">{selectedRecord.licensePlate}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-700"><span className="font-bold">Issue:</span> {selectedRecord.complaint}</p>
                <p className="text-sm text-slate-700 mt-2"><span className="font-bold">Fix:</span> {selectedRecord.diagnosis}</p>
              </div>
              {/* Footer Actions */}
              <div className="pt-4 flex justify-end">
                {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER) && selectedRecord.status !== QueueStatus.VOID && (
                  <button onClick={() => { onVoid(selectedRecord.id, "Admin Force"); setSelectedRecord(null); }} className="text-red-600 text-sm font-bold flex items-center hover:bg-red-50 px-3 py-2 rounded-lg"><Trash2 className="w-4 h-4 mr-2" /> Void Transaction</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceReminderView = ({ history, reminders, setReminders }: { history: ServiceRecord[], reminders: ServiceReminder[], setReminders: any }) => {
  const [generating, setGenerating] = useState<string | null>(null);
  const runAutoScheduler = async () => {
    const historyText = history.slice(0, 3).map(h => `${h.vehicleModel} (${h.finishTime}) - ${h.diagnosis}`).join('; ');
    const prediction = await predictServiceSchedule(historyText);
    alert(`AI Prediction: ${prediction}`);
  };

  const handleGenerateMessage = async (reminder: ServiceReminder) => {
    setGenerating(reminder.id);
    try {
      const msg = await generateMarketingMessage(reminder.customerName, reminder.vehicleModel, new Date(reminder.lastServiceDate).toLocaleDateString(), reminder.serviceType);
      await reminderService.update(reminder.id, { messageTemplate: msg });
      setReminders(reminders.map(r => r.id === reminder.id ? { ...r, messageTemplate: msg } : r));
    } catch (e) {
      console.error(e);
      alert("Failed to save message template");
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-900">CRM</h2><p className="text-slate-500 text-sm">Automated Reminders</p></div>
        <button onClick={runAutoScheduler} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center text-sm font-bold"><CalendarClock className="w-4 h-4 mr-2" /> Auto-Schedule</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reminders.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className={`absolute top-0 left-0 w-1 h-full ${new Date(r.nextServiceDate) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-slate-900">{r.customerName}</h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">{r.status}</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{r.vehicleModel} • {new Date(r.nextServiceDate).toLocaleDateString()}</p>
            {r.messageTemplate && <div className="bg-slate-50 p-3 rounded-lg text-xs italic text-slate-500 mb-4 border border-slate-200">"{r.messageTemplate.substring(0, 50)}..."</div>}
            <div className="flex gap-2">
              <button onClick={() => handleGenerateMessage(r)} disabled={generating === r.id} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">{generating === r.id ? '...' : 'Draft AI'}</button>
              <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md shadow-green-600/20">WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookingManagementView = ({ bookings, setBookings, onAddToQueue }: { bookings: BookingRecord[], setBookings: any, onAddToQueue: (data: Partial<ServiceRecord>) => void }) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      const updated = await bookingService.updateStatus(id, status);
      setBookings((prev: BookingRecord[]) => prev.map(b => b.id === id ? updated : b));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(updated);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update booking status");
    }
  };

  const handleCheckIn = (booking: BookingRecord) => {
    // Move to Queue
    onAddToQueue({
      licensePlate: booking.licensePlate,
      customerName: booking.customerName,
      phone: booking.phone,
      vehicleModel: booking.vehicleModel,
      complaint: booking.complaint,
      diagnosis: booking.aiAnalysis || 'Check-in from Online Booking',
    });

    // Update Booking Status
    handleUpdateStatus(booking.id, BookingStatus.CHECKED_IN);
    setSelectedBooking(null);
  };

  const handleAnalyzeBooking = async () => {
    if (!selectedBooking || !selectedBooking.audioBase64) return;

    setIsAnalyzing(true);
    const analysis = await analyzeBookingWithAudio(selectedBooking.audioBase64, selectedBooking.complaint, selectedBooking.vehicleModel);

    // Update both local state and parent state
    const updatedBooking = { ...selectedBooking, aiAnalysis: analysis };
    setSelectedBooking(updatedBooking);
    setBookings((prev: BookingRecord[]) => prev.map(b => b.id === selectedBooking.id ? updatedBooking : b));

    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Booking Requests</h2><p className="text-slate-500 text-sm">Online Confirmations</p></div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-slate-500 font-bold text-xs uppercase"><th className="p-5">Date</th><th className="p-5">Customer</th><th className="p-5">Details</th><th className="p-5">Status</th><th className="p-5"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="p-5 font-bold text-slate-900">{b.bookingDate}</td>
                <td className="p-5">{b.customerName}<div className="text-xs text-slate-400">{b.vehicleModel}</div></td>
                <td className="p-5 text-slate-600 truncate max-w-xs">{b.complaint}</td>
                <td className="p-5">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === BookingStatus.CONFIRMED ? 'bg-blue-100 text-blue-700' :
                    b.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                      b.status === BookingStatus.CHECKED_IN ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                    {b.status === BookingStatus.CHECKED_IN ? 'DONE' : b.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-5">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-bold text-xl text-slate-900">Booking Review</h3>
                <p className="text-slate-500 text-sm font-mono mt-1">{selectedBooking.bookingCode}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-900 transition-colors bg-white p-2 rounded-full shadow-sm border border-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
                  <p className="font-bold text-slate-900">{selectedBooking.customerName}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Vehicle</p>
                  <p className="font-bold text-slate-900">{selectedBooking.licensePlate}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.vehicleModel}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Schedule</p>
                    <div className="flex items-center text-slate-700 font-medium">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {selectedBooking.bookingDate} <span className="mx-2 text-slate-300">|</span> {selectedBooking.bookingTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedBooking.status === BookingStatus.CONFIRMED ? 'bg-blue-100 text-blue-700' :
                      selectedBooking.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                        selectedBooking.status === BookingStatus.CHECKED_IN ? 'bg-green-100 text-green-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {selectedBooking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Complaint & AI */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Complaint Note</p>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">
                    "{selectedBooking.complaint}"
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Bot className="w-4 h-4 text-indigo-600 mr-2" />
                      <span className="text-xs font-bold text-indigo-700 uppercase">AI Diagnosis</span>
                    </div>
                    {/* Action Button for AI */}
                    {!selectedBooking.aiAnalysis && selectedBooking.audioBase64 && (
                      <button
                        onClick={handleAnalyzeBooking}
                        disabled={isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                      >
                        {isAnalyzing ? (
                          <><Settings className="w-3 h-3 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Cpu className="w-3 h-3 mr-2" /> Run Analysis</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Audio Player Section */}
                  {selectedBooking.audioBase64 && (
                    <div className="mb-4 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                      <div className="flex items-center mb-1 px-1">
                        <FileAudio className="w-3 h-3 text-indigo-400 mr-1" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Input Audio</span>
                      </div>
                      <audio controls className="w-full h-8" src={`data:audio/wav;base64,${selectedBooking.audioBase64}`}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedBooking.aiAnalysis ? (
                    <div className="text-indigo-900 text-sm space-y-1">
                      {selectedBooking.aiAnalysis.split('\n').map((line, idx) => {
                        const cleanLine = line.trim();
                        if (!cleanLine) return null;
                        // Check for list markers (1., -, *) for styling
                        const isListItem = /^(\d+\.|-|\*)\s/.test(cleanLine);
                        return (
                          <p key={idx} className={`leading-relaxed ${isListItem ? 'pl-4' : ''}`}>
                            {cleanLine}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-indigo-400 text-sm italic">
                      {selectedBooking.audioBase64
                        ? "Audio recording available. Run analysis to get insights."
                        : "No audio recording provided by customer."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {selectedBooking.status === BookingStatus.PENDING && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.REJECTED)}
                    className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.CONFIRMED)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" /> Approve Request
                  </button>
                </>
              )}

              {selectedBooking.status === BookingStatus.CONFIRMED && (
                <button
                  onClick={() => handleCheckIn(selectedBooking)}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center w-full justify-center sm:w-auto"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Check-in to Queue
                </button>
              )}

              {(selectedBooking.status === BookingStatus.REJECTED || selectedBooking.status === BookingStatus.CHECKED_IN) && (
                <p className="text-sm text-slate-500 font-medium italic py-2">This booking has been finalized.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
};


// --- Main App & Sidebar Redesign ---

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState['currentView']>('LOGIN');
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [queue, setQueue] = useState<ServiceRecord[]>([]);
  const [history, setHistory] = useState<ServiceRecord[]>([]);
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLanding, setIsLanding] = useState(true);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string>('');

  const refreshData = useCallback(async () => {
    try {
      const [userData, invData, queueData, historyData, bookingData, reminderData] = await Promise.all([
        userService.getAll(),
        inventoryService.getAll(),
        serviceRecordService.getQueue(),
        serviceRecordService.getHistory(),
        bookingService.getAll(),
        reminderService.getAll()
      ]);
      setUsers(userData);
      setInventory(invData);
      setQueue(queueData);
      setHistory(historyData);
      setBookings(bookingData);
      setReminders(reminderData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Database connection failed. Please check your connection.");
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Dashboard Mock Data (Calculated from real data now where possible, or kept mock for graph)
  const dashboardStats = {
    revenue: [
      { time: '08:00', amount: 0 }, { time: '10:00', amount: 500000 },
      { time: '12:00', amount: 1200000 }, { time: '14:00', amount: 1800000 },
      { time: '16:00', amount: 2500000 }
    ],
    status: [
      { name: 'Finished', value: history.filter(q => q.status === QueueStatus.FINISHED).length },
      { name: 'Working', value: queue.filter(q => q.status === QueueStatus.PROCESS).length },
      { name: 'Waiting', value: queue.filter(q => q.status === QueueStatus.WAITING).length },
      { name: 'Pending', value: bookings.filter(b => b.status === BookingStatus.PENDING).length },
    ]
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLanding(false);
    if (user.role === Role.MEKANIK) setView('MECHANIC');
    else if (user.role === Role.KASIR) setView('CASHIER');
    else setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLanding(true);
    setView('LOGIN');
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
          // In Supabase, we might just update the status. 
          // But keeping the logic: 'Finish' implies moving to history list in UI (which is just a filter on mapped ServiceRecord).
          // Actually, our serviceRecordService maps logic.
          // We just need to update the record.
          await serviceRecordService.update(id, {
            status: QueueStatus.FINISHED,
            finishTime: new Date().toISOString(),
            serviceCost: 50000,
            totalCost: 50000,
            weight: ServiceWeight.LIGHT
          });
          // Optimistic update or refresh
          refreshData();
        }
      } else {
        await serviceRecordService.update(id, { status });
        // Optimistic update
        setQueue(queue.map(q => q.id === id ? { ...q, status } : q));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleVoidHistory = async (id: string, reason: string) => {
    try {
      await serviceRecordService.update(id, { status: QueueStatus.VOID, notes: `VOID: ${reason}` });
      refreshData();
    } catch (e) {
      console.error(e);
      alert("Failed to void transaction");
    }
  };

  const handleGuestBookingSubmit = async (data: any) => {
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

      // Navigate to Tracking
      setActiveTrackingCode(newBooking.bookingCode);
      setView('GUEST_TRACKING');
      setIsLanding(false);
    } catch (e) {
      console.error(e);
      alert("Failed to submit booking");
    }
  };

  if (view === 'GUEST_BOOKING') return <GuestBookingForm onSubmit={handleGuestBookingSubmit} onBack={() => { setView('LOGIN'); setIsLanding(true); }} />;
  if (view === 'GUEST_TRACKING') return <GuestTrackingView bookings={bookings} onBack={() => { setView('LOGIN'); setIsLanding(true); setActiveTrackingCode(''); }} initialCode={activeTrackingCode} />;

  if (!currentUser) {
    if (isLanding) return <LandingPage onLoginClick={() => setIsLanding(false)} onGuestBooking={() => setView('GUEST_BOOKING')} onGuestTracking={() => setView('GUEST_TRACKING')} />;
    return <LoginForm onLogin={handleLogin} onBack={() => setIsLanding(true)} users={users} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Dark Automotive Theme */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 fixed h-full z-20 hidden md:flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-glow">
            <Wrench className="text-white w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-tight block">ABE.AUTO</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Management OS</span>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Main Menu</p>
          {(currentUser.role === Role.OWNER || currentUser.role === Role.ADMIN) && (
            <button onClick={() => setView('DASHBOARD')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Dashboard
            </button>
          )}

          {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER || currentUser.role === Role.KASIR) && (
            <button onClick={() => setView('FRONT_OFFICE')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'FRONT_OFFICE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Front Office
            </button>
          )}

          {(currentUser.role === Role.MEKANIK) && (
            <button onClick={() => setView('MECHANIC')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'MECHANIC' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Wrench className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Workbench
            </button>
          )}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Operations</p>

          {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER) && (
            <button onClick={() => setView('INVENTORY')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'INVENTORY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <ShoppingCart className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Inventory
            </button>
          )}

          <button onClick={() => setView('HISTORY')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'HISTORY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <History className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> History
          </button>

          {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER) && (
            <>
              <button onClick={() => setView('REMINDER')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'REMINDER' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <MessageSquare className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> CRM & Alerts
              </button>
              <button onClick={() => setView('BOOKING_ADMIN')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'BOOKING_ADMIN' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <BookOpen className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Bookings
              </button>
            </>
          )}

          {currentUser.role === Role.OWNER && (
            <button onClick={() => setView('USERS')} className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${view === 'USERS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <ShieldCheck className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Staff Management
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center mb-4 px-2">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full mr-3 border-2 border-slate-700" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 font-mono">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-8 lg:p-12 overflow-x-hidden">
        {view === 'DASHBOARD' && <Dashboard stats={dashboardStats} inventory={inventory} />}
        {view === 'FRONT_OFFICE' && <FrontOffice onAddQueue={addQueue} />}
        {view === 'MECHANIC' && <MechanicView queue={queue} updateStatus={updateQueueStatus} bookings={bookings} setBookings={setBookings} />}
        {view === 'INVENTORY' && <InventoryView inventory={inventory} onRefresh={refreshData} />}
        {view === 'HISTORY' && <ServiceHistoryView history={history} currentUser={currentUser} onVoid={handleVoidHistory} />}
        {view === 'REMINDER' && <ServiceReminderView history={history} reminders={reminders} setReminders={setReminders} />}
        {view === 'BOOKING_ADMIN' && <BookingManagementView bookings={bookings} setBookings={setBookings} onAddToQueue={addQueue} />}
        {view === 'USERS' && <UserManagementView users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />}

        {(view === 'CASHIER' || view === 'FINANCE') && (
          <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Settings className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Under Construction</h3>
            <p className="text-sm">Module is currently being engineered.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
