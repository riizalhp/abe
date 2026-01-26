import React from 'react';
import { Bot, Wrench, Search, CalendarClock, Cpu, Gauge, MessageSquare } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
    onGuestBooking: () => void;
    onGuestTracking: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onGuestBooking, onGuestTracking }) => {
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

export default LandingPage;
