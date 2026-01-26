import React, { useState } from 'react';
import { Wrench, Clock, Calendar, Bot } from 'lucide-react';
import { ServiceRecord, QueueStatus, BookingRecord } from '../../types';
import { analyzeBookingWithAudio } from '../../services/geminiService';

interface MechanicWorkbenchProps {
    queue: ServiceRecord[];
    updateStatus: (id: string, status: QueueStatus) => void;
    bookings: BookingRecord[];
    setBookings: (bookings: BookingRecord[]) => void;
}

const MechanicWorkbench: React.FC<MechanicWorkbenchProps> = ({ queue, updateStatus, bookings, setBookings }) => {
    const [activeTab, setActiveTab] = useState<'JOBS' | 'QUEUE' | 'BOOKINGS'>('JOBS');
    const myTasks = queue.filter(q => q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING);
    const waitingTasks = queue.filter(q => q.status === QueueStatus.WAITING);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);

    const handleAnalyze = async (booking: BookingRecord) => {
        if (!booking.audioBase64) return;
        setAnalyzingId(booking.id);
        const analysis = await analyzeBookingWithAudio(booking.audioBase64, booking.complaint, booking.vehicleModel);
        // Note: This relies on parent setBookings which might be complex if state is in App.tsx. 
        // In refactor, we assume parent handles state update via prop.
        const updatedBookings = bookings.map(b => b.id === booking.id ? { ...b, aiAnalysis: analysis } : b);
        setBookings(updatedBookings);
        setAnalyzingId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
                {[
                    { id: 'JOBS', label: 'Active Jobs', icon: Wrench },
                    { id: 'QUEUE', label: 'Queue', icon: Clock },
                    { id: 'BOOKINGS', label: 'Online', icon: Calendar }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all flex items-center ${activeTab === tab.id
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'JOBS' && (
                <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                    {myTasks.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No active jobs. Pick from queue.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {myTasks.map(task => (
                                <div key={task.id} className="bg-white p-6 rounded-2xl shadow-card border-l-4 border-blue-600">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{task.licensePlate}</h3>
                                            <p className="text-slate-500 font-medium">{task.vehicleModel}</p>
                                        </div>
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">
                                            {task.status}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer Issue</p>
                                            <p className="text-slate-700">{task.complaint}</p>
                                        </div>
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs font-bold text-blue-400 uppercase mb-1">Diagnosis</p>
                                            <p className="text-slate-700">{task.diagnosis || task.aiDiagnosis}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => updateStatus(task.id, QueueStatus.PENDING)}
                                            className="flex-1 border border-amber-200 bg-amber-50 text-amber-700 py-3 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                                        >
                                            Pending Parts
                                        </button>
                                        <button
                                            onClick={() => updateStatus(task.id, QueueStatus.FINISHED)}
                                            className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                                        >
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Reusing Table Styles for Queue & Bookings */}
            {(activeTab === 'QUEUE' || activeTab === 'BOOKINGS') && (
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider">
                                {activeTab === 'QUEUE'
                                    ? <>
                                        <th className="p-5">Ticket</th><th className="p-5">Vehicle</th><th className="p-5">Issue</th><th className="p-5 text-right">Action</th>
                                    </>
                                    : <>
                                        <th className="p-5">Time</th><th className="p-5">Vehicle</th><th className="p-5">Audio Analysis</th><th className="p-5">Status</th>
                                    </>
                                }
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeTab === 'QUEUE' && waitingTasks.map(task => (
                                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5 font-mono font-bold text-slate-900">{task.ticketNumber}</td>
                                    <td className="p-5">
                                        <div className="font-bold text-slate-900">{task.licensePlate}</div>
                                        <div className="text-xs text-slate-500">{task.vehicleModel}</div>
                                    </td>
                                    <td className="p-5 text-slate-600 truncate max-w-xs">{task.complaint}</td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => updateStatus(task.id, QueueStatus.PROCESS)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-200 transition-all">Start Job</button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'BOOKINGS' && bookings.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-900">{b.bookingTime}</div>
                                        <div className="text-xs text-slate-500">{b.bookingDate}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="font-bold text-slate-900">{b.licensePlate}</div>
                                        <div className="text-xs text-slate-500">{b.vehicleModel}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs text-slate-500 italic">"{b.complaint}"</span>
                                            {b.aiAnalysis && (
                                                <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-100">
                                                    <Bot className="w-3 h-3 inline mr-1" /> {b.aiAnalysis.substring(0, 50)}...
                                                </div>
                                            )}
                                            {!b.aiAnalysis && b.audioBase64 && (
                                                <button onClick={() => handleAnalyze(b)} disabled={analyzingId === b.id} className="text-blue-600 text-xs font-bold hover:underline flex items-center">
                                                    {analyzingId === b.id ? 'Processing...' : 'Run AI Diag'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MechanicWorkbench;
