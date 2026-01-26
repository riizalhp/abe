import React from 'react';
import {
    DollarSign, Wrench, AlertCircle, Activity,
    AreaChart as AreaChartIcon, PieChart as PieChartIcon
} from 'lucide-react';
import {
    AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { InventoryItem } from '../../types';

interface DashboardProps {
    stats: {
        revenue: any[],
        status: any[],
        summary: any
    };
    inventory: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, inventory }) => {
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
                    { label: 'Revenue Today', val: `Rp ${(stats.summary.revenueToday || 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Vehicles In', val: `${stats.summary.vehiclesToday || 0} Units`, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Critical Stock', val: `${lowStock.length} Items`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Avg Rating', val: `${(stats.summary.rating || 0).toFixed(1)} / 5.0`, icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' }
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

export default Dashboard;
