import React, { useState } from 'react';
import { Wrench, ChevronLeft, User as UserIcon, Lock, ArrowRight } from 'lucide-react';
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

export default LoginPage;
