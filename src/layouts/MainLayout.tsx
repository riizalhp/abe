import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User, Role } from '../../types';

interface MainLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onLogout }) => {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar currentUser={currentUser} onLogout={onLogout} />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 p-8 lg:p-12 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
