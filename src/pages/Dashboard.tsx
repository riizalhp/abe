import React from 'react';
import {
    AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardProps {
    stats: {
        revenue: any[],
        status: any[],
        summary: any
    };
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {

    return (
        <div className="space-y-4 md:space-y-6 max-w-full overflow-hidden">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white dark:bg-[#1A2230] p-4 md:p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft hover:shadow-hover transition-shadow group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">arrow_upward</span> 12%
                        </span>
                    </div>
                    <h4 className="text-slate-500 text-sm font-medium mb-1">Revenue Today</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {(stats.summary.revenueToday || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2230] p-4 md:p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft hover:shadow-hover transition-shadow group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">directions_car</span>
                        </div>
                    </div>
                    <h4 className="text-slate-500 text-sm font-medium mb-1">Vehicles Today</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.summary.vehiclesToday || 0}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2230] p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft hover:shadow-hover transition-shadow group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">star</span>
                        </div>
                    </div>
                    <h4 className="text-slate-500 text-sm font-medium mb-1">Average Rating</h4>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{(stats.summary.rating || 0).toFixed(1)} / 5.0</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white dark:bg-[#1A2230] p-4 md:p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft h-80 md:h-96">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-primary">
                            <span className="material-symbols-outlined">analytics</span>
                        </span>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Revenue Analytics</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={stats.revenue}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-[#1A2230] p-4 md:p-6 rounded-xl border border-border-light dark:border-slate-800 shadow-soft h-80 md:h-96">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                            <span className="material-symbols-outlined">donut_large</span>
                        </span>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Queue Distribution</h3>
                    </div>
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
                                {stats.status.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#94a3b8'][index % 4]} stroke="none" />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
