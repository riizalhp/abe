import React from 'react';
import {
    Wrench, LogOut, LayoutDashboard, Users,
    History, MessageSquare, BookOpen, ShieldCheck
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { User, Role } from '../../types';

interface SidebarProps {
    currentUser: User;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout }) => {
    const location = useLocation();
    const path = location.pathname;

    const isActive = (p: string) => path === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white';

    return (
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
                    <Link to="/dashboard" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/dashboard')}`}>
                        <LayoutDashboard className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Dashboard
                    </Link>
                )}

                {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER || currentUser.role === Role.KASIR) && (
                    <Link to="/front-office" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/front-office')}`}>
                        <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Front Office
                    </Link>
                )}

                {(currentUser.role === Role.MEKANIK) && (
                    <Link to="/mechanic" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/mechanic')}`}>
                        <Wrench className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Workbench
                    </Link>
                )}

                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Operations</p>

                <Link to="/history" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/history')}`}>
                    <History className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> History
                </Link>

                {(currentUser.role === Role.ADMIN || currentUser.role === Role.OWNER) && (
                    <>
                        <Link to="/crm" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/crm')}`}>
                            <MessageSquare className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> CRM & Alerts
                        </Link>
                        <Link to="/bookings" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/bookings')}`}>
                            <BookOpen className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Bookings
                        </Link>
                    </>
                )}

                {currentUser.role === Role.OWNER && (
                    <>
                        <Link to="/staff" className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive('/staff')}`}>
                            <ShieldCheck className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Staff Management
                        </Link>

                    </>
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
                    onClick={onLogout}
                    className="w-full flex items-center justify-center px-4 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
