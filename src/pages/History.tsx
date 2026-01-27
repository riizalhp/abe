import React, { useState } from 'react';
import { Eye, X, Trash2, User, Car, Calendar, TrendingUp } from 'lucide-react';
import { ServiceRecord, User as UserType, Role, QueueStatus } from '../../types';
import { licensePlateUtils } from '../../services/licensePlateUtils';

interface HistoryProps {
    history: ServiceRecord[];
    currentUser: UserType;
    onVoid: (id: string, reason: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, currentUser, onVoid }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
    const [viewMode, setViewMode] = useState<'records' | 'customers'>('records');

    // Get customer master data
    const customerMasterData = licensePlateUtils.getCustomerMasterData(history);

    const filteredHistory = history.filter(record => {
        if (currentUser.role === Role.MEKANIK && record.mechanicId !== currentUser.id) return false;
        const matchesSearch = record.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || record.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = filterDate ? record.entryTime.startsWith(filterDate) : true;
        return matchesSearch && matchesDate;
    });

    const filteredCustomers = customerMasterData.filter(customer => {
        const matchesSearch = customer.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || customer.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getCustomerHistory = (customerId: string) => {
        const grouped = licensePlateUtils.groupByCustomer(history);
        return grouped[customerId] || [];
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Service History</h2>
                    <p className="text-slate-500 text-sm">Archives & Customer Master Data</p>
                </div>
                <div className="flex gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('records')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'records' 
                                ? 'bg-slate-900 text-white' 
                                : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Records
                        </button>
                        <button
                            onClick={() => setViewMode('customers')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'customers' 
                                ? 'bg-slate-900 text-white' 
                                : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Customers
                        </button>
                    </div>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 bg-white" />
                    {viewMode === 'records' && (
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm bg-white" />
                    )}
                </div>
            </div>

            {/* Customer Master Data View */}
            {viewMode === 'customers' && (
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-slate-600" />
                            <h3 className="font-bold text-slate-900">Customer Master Data</h3>
                            <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">
                                {filteredCustomers.length} customers
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider">
                                    <th className="p-4">License Plate</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Vehicle</th>
                                    <th className="p-4 text-center">Total Services</th>
                                    <th className="p-4">Last Service</th>
                                    <th className="p-4">First Service</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.customerId} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono font-bold text-slate-900 text-lg">
                                                {customer.licensePlate}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">
                                                ID: {customer.customerId}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-900">
                                                {customer.customerName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {customer.phone}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Car className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-700">{customer.vehicleModel}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-lg">
                                                {customer.totalServices}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {customer.lastService && (
                                                <div className="text-slate-700">
                                                    {new Date(customer.lastService).toLocaleDateString('id-ID')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {customer.firstService && (
                                                <div className="text-slate-500">
                                                    {new Date(customer.firstService).toLocaleDateString('id-ID')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => {
                                                    const customerHistory = getCustomerHistory(customer.customerId);
                                                    if (customerHistory.length > 0) {
                                                        setSelectedRecord({
                                                            ...customerHistory[0],
                                                            id: `customer-${customer.customerId}`,
                                                            customerHistory: customerHistory
                                                        } as any);
                                                    }
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                <TrendingUp className="w-3 h-3" />
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Service Records View */}
            {viewMode === 'records' && (
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
                                    <td className="p-5 font-mono font-bold">{licensePlateUtils.getDisplayFormat(r.licensePlate)}</td>
                                    <td className="p-5">{r.customerName}</td>
                                    <td className="p-5 text-right font-medium">Rp {(r.totalCost || 0).toLocaleString()}</td>
                                    <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{r.status}</span></td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => setSelectedRecord(r)} className="text-blue-600 hover:text-blue-800">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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

export default History;
