import React, { useState } from 'react';
import { User } from '../../types';

interface LoginPageProps {
    onLogin: (user: User) => void;
    onBack: () => void;
    users: User[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, users }) => {
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
        <div className="min-h-screen flex items-center justify-center bg-background-dark relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-background-dark to-slate-950 opacity-80"></div>
            <div className="absolute -left-20 top-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px]"></div>
            <div className="absolute -right-32 bottom-20 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]"></div>

            <div className="relative bg-white dark:bg-[#1A2230] border border-border-light dark:border-slate-800 p-8 rounded-xl shadow-soft w-full max-w-md">
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>

                <div className="text-center mb-8 pt-4">
                    <div className="size-16 bg-primary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-white text-2xl">local_car_wash</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Login</h1>
                    <p className="text-slate-500 mt-2 text-sm">Enter credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full h-12 pl-11 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full h-12 pl-11 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-700 dark:text-red-300 text-sm text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <span className="material-symbols-outlined text-xs mr-1">error</span>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                        <span>Sign In</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>

                    <div className="text-center pt-4">
                        <p className="text-xs text-slate-500">Default: owner / 123</p>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default LoginPage;
