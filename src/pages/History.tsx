import React, { useState } from 'react';
import { Eye, X, Trash2 } from 'lucide-react';
import { ServiceRecord, User, Role, QueueStatus } from '../../types';

interface HistoryProps {
    history: ServiceRecord[];
    currentUser: User;
    onVoid: (id: string, reason: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, currentUser, onVoid }) => {
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
        <div className="space-y-6 animate-in fade-in duration-500">
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
                                <td className="p-5 text-right font-medium">Rp {(r.totalCost || 0).toLocaleString()}</td>
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

export default History;
