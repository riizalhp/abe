import React, { useState } from 'react';
import { Wrench, Clock, Calendar, Bot, User } from 'lucide-react';
import { ServiceRecord, QueueStatus, BookingRecord, User as UserType, Role } from '../../types';
import { analyzeBookingWithAudio } from '../../services/geminiService';

interface MechanicWorkbenchProps {
    queue: ServiceRecord[];
    updateStatus: (id: string, status: QueueStatus, mechanicId?: string) => void;
    bookings: BookingRecord[];
    setBookings: (bookings: BookingRecord[]) => void;
    users: UserType[];
    currentUser: UserType | null;
}

const MechanicWorkbench: React.FC<MechanicWorkbenchProps> = ({ queue, updateStatus, bookings, setBookings, users, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'JOBS' | 'QUEUE' | 'BOOKINGS'>('JOBS');
    const [selectedMechanic, setSelectedMechanic] = useState<{ [jobId: string]: string }>({});
    const [showMechanicSelect, setShowMechanicSelect] = useState<string | null>(null);

    // Get only mechanics
    const mechanics = users.filter(u => u.role === Role.MEKANIK);

    // Filter tasks based on current user role
    const myTasks = queue.filter(q => {
        if (currentUser?.role === Role.MEKANIK) {
            // Mechanic only sees their own assigned jobs
            return q.mechanicId === currentUser.id && 
                   (q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING);
        }
        // Admin/Owner sees all in-progress jobs
        return q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING;
    });
    
    const waitingTasks = queue.filter(q => q.status === QueueStatus.WAITING);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);

    // Check if mechanic has active job
    const getMechanicActiveJob = (mechanicId: string, excludeJobId?: string) => {
        return queue.find(
            q => q.mechanicId === mechanicId && 
                 (q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING) &&
                 q.id !== excludeJobId
        );
    };

    // Check if current mechanic can take new job
    const canCurrentMechanicTakeJob = () => {
        if (currentUser?.role !== Role.MEKANIK) return true;
        return !getMechanicActiveJob(currentUser.id);
    };

    const handleStartJob = (jobId: string) => {
        let mechId = selectedMechanic[jobId];
        
        // If current user is mechanic, use their ID
        if (currentUser?.role === Role.MEKANIK) {
            mechId = currentUser.id;
        }
        
        if (!mechId) {
            alert('Pilih mekanik terlebih dahulu');
            return;
        }
        updateStatus(jobId, QueueStatus.PROCESS, mechId);
        setShowMechanicSelect(null);
        setSelectedMechanic(prev => ({ ...prev, [jobId]: '' }));
    };

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
                            <p className="text-slate-500 font-medium">
                                {currentUser?.role === Role.MEKANIK 
                                    ? 'Belum ada job. Ambil dari Queue.' 
                                    : 'Tidak ada job aktif. Assign mekanik dari Queue.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {myTasks.map(task => (
                                <div key={task.id} className="bg-white p-6 rounded-2xl shadow-card border-l-4 border-blue-600">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{task.licensePlate}</h3>
                                            <p className="text-slate-500 font-medium">{task.vehicleModel}</p>
                                            {/* Show assigned mechanic */}
                                            {task.mechanicId && (
                                                <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                                                    <User className="w-4 h-4" />
                                                    <span className="font-medium">
                                                        {users.find(u => u.id === task.mechanicId)?.name || 'Mekanik'}
                                                    </span>
                                                </div>
                                            )}
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
                                        {currentUser?.role === Role.MEKANIK ? (
                                            // Mekanik langsung ambil job dengan ID sendiri
                                            <button 
                                                onClick={() => handleStartJob(task.id)}
                                                disabled={!canCurrentMechanicTakeJob()}
                                                className={`font-bold text-xs uppercase px-3 py-1.5 rounded-lg border transition-all ${
                                                    canCurrentMechanicTakeJob() 
                                                        ? 'text-blue-600 hover:text-blue-800 bg-blue-50 border-blue-100 hover:border-blue-200'
                                                        : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                                                }`}
                                            >
                                                {canCurrentMechanicTakeJob() ? 'Ambil Job' : 'Selesaikan Job Dulu'}
                                            </button>
                                        ) : (
                                            // Admin/Owner: pilih mekanik dulu
                                            showMechanicSelect === task.id ? (
                                                <div className="flex flex-col gap-2 min-w-[180px]">
                                                    <select
                                                        value={selectedMechanic[task.id] || ''}
                                                        onChange={(e) => setSelectedMechanic(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                        className="p-2 border border-slate-200 rounded-lg text-xs bg-white"
                                                    >
                                                        <option value="">-- Pilih Mekanik --</option>
                                                        {mechanics.map(m => {
                                                            const activeJob = getMechanicActiveJob(m.id);
                                                            return (
                                                                <option key={m.id} value={m.id} disabled={!!activeJob}>
                                                                    {m.name} {activeJob ? `(Sibuk)` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => handleStartJob(task.id)}
                                                            disabled={!selectedMechanic[task.id]}
                                                            className="flex-1 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 px-2 py-1 rounded text-xs font-bold"
                                                        >
                                                            Mulai
                                                        </button>
                                                        <button 
                                                            onClick={() => setShowMechanicSelect(null)}
                                                            className="px-2 py-1 border rounded text-xs"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setShowMechanicSelect(task.id)} 
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-200 transition-all"
                                                >
                                                    Assign
                                                </button>
                                            )
                                        )}
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
