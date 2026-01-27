import React from 'react';
import { Outlet } from 'react-router-dom';
import NewSidebar from '../components/NewSidebar';
import { User } from '../../types';

interface MainLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onLogout }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen">
            <NewSidebar currentUser={currentUser} onLogout={onLogout} />
            
            <main className="min-h-screen bg-background-light dark:bg-background-dark xl:ml-72">
                <header className="h-16 sticky top-0 bg-white/80 dark:bg-[#1A2230]/80 backdrop-blur-md border-b border-border-light dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <button className="size-10 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors xl:hidden">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">ABE System</h1>
                            <p className="text-xs md:text-sm text-slate-500 hidden sm:block">Automotive Business Ecosystem</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden xl:block">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                            <input 
                                className="h-10 pl-10 pr-4 w-48 xl:w-64 rounded-lg bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 placeholder-slate-400" 
                                placeholder="Search..." 
                                type="text"
                            />
                        </div>
                        <button className="size-10 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors xl:hidden">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        <button className="size-10 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                </header>
                
                <div className="p-2 md:p-4 xl:p-6 w-full max-w-full overflow-hidden">
                    <div className="w-full max-w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
