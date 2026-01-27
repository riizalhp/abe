import React, { useState } from 'react';
import { BookingRecord, ServiceRecord, BookingStatus } from '../../types';
import { bookingService } from '../../services/bookingService';
import { analyzeBookingWithAudio } from '../../services/geminiService';

interface BookingsProps {
    bookings: BookingRecord[];
    setBookings: (bookings: BookingRecord[]) => void;
    onAddToQueue: (data: Partial<ServiceRecord>) => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, setBookings, onAddToQueue }) => {
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        try {
            const updated = await bookingService.updateStatus(id, status);
            // Parent state update expected via prop function, but here we do optimistic/prop update
            // Since `setBookings` is passed, we can update it.
            const newBookings = bookings.map(b => b.id === id ? updated : b);
            setBookings(newBookings);

            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(updated);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update booking status");
        }
    };

    const handleCheckIn = (booking: BookingRecord) => {
        // Move to Queue
        onAddToQueue({
            licensePlate: booking.licensePlate,
            customerName: booking.customerName,
            phone: booking.phone,
            vehicleModel: booking.vehicleModel,
            complaint: booking.complaint,
            diagnosis: booking.aiAnalysis || 'Check-in from Online Booking',
        });

        // Update Booking Status
        handleUpdateStatus(booking.id, BookingStatus.CHECKED_IN);
        setSelectedBooking(null);
    };

    const handleAnalyze = async (booking: BookingRecord) => {
        if (!booking.audioBase64) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeBookingWithAudio(booking.audioBase64, booking.complaint, booking.vehicleModel);
            const updated = await bookingService.updateStatus(booking.id, booking.status, analysis);

            const newBookings = bookings.map(b => b.id === booking.id ? { ...b, aiAnalysis: analysis } : b);
            setBookings(newBookings);
            if (selectedBooking && selectedBooking.id === booking.id) {
                setSelectedBooking({ ...selectedBooking, aiAnalysis: analysis });
            }
        } catch (e) {
            console.error(e);
            alert("Analysis failed");
        }
        setIsAnalyzing(false);
    };

    // Note: handleAnalyzeBooking logic is similar to MechanicView but handled inside Review modal here

    return (
        <div className="space-y-4 md:space-y-6 max-w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                            <span className="material-symbols-outlined text-xl">calendar_month</span>
                        </div>
                        Online Bookings
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage customer booking requests</p>
                </div>
            </div>
            {/* Bookings Table */}
            <div className="bg-white dark:bg-[#1A2230] rounded-xl border border-border-light dark:border-slate-800 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr className="text-left">
                                <th className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Date & Time</th>
                                <th className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Customer</th>
                                <th className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Vehicle</th>
                                <th className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 md:p-5 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {bookings.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 md:p-5">
                                        <div className="font-semibold text-slate-900 dark:text-white">{b.bookingDate}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{b.bookingTime}</div>
                                    </td>
                                    <td className="p-4 md:p-5">
                                        <div className="font-medium text-slate-900 dark:text-white">{b.customerName}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{b.phone}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 md:hidden">{b.vehicleModel}</div>
                                    </td>
                                    <td className="p-4 md:p-5 hidden md:table-cell">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">{b.licensePlate}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{b.vehicleModel}</div>
                                    </td>
                                    <td className="p-4 md:p-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            b.status === BookingStatus.CONFIRMED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            b.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            b.status === BookingStatus.CHECKED_IN ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {b.status === BookingStatus.CHECKED_IN ? 'COMPLETED' : b.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-5">
                                        <button
                                            onClick={() => setSelectedBooking(b)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">visibility</span>
                                            <span className="hidden sm:inline">Review</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1A2230] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border-light dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-300">
                        {/* Modal Header */}
                        <div className="p-4 md:p-6 border-b border-border-light dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Booking Review</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{selectedBooking.bookingCode}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedBooking(null)} 
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* Customer & Vehicle Info */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border-light dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Customer Information</label>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.customerName}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">phone</span>
                                                {selectedBooking.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Vehicle Information</label>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.licensePlate}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedBooking.vehicleModel}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Schedule & Actions */}
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Scheduled Time</label>
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-primary">schedule</span>
                                            <span className="font-medium">{selectedBooking.bookingDate}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-medium">{selectedBooking.bookingTime}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {selectedBooking.status === BookingStatus.PENDING && (
                                            <>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.REJECTED)} 
                                                    className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.CONFIRMED)} 
                                                    className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                    Confirm
                                                </button>
                                            </>
                                        )}
                                        {selectedBooking.status === BookingStatus.CONFIRMED && (
                                            <button 
                                                onClick={() => handleCheckIn(selectedBooking)} 
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-base">login</span>
                                                Check In to Queue
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Complaint */}
                            <div className="bg-white dark:bg-slate-800/30 border border-border-light dark:border-slate-700 p-4 rounded-xl">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">report</span>
                                    Customer Complaint
                                </label>
                                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">"{selectedBooking.complaint}"</p>
                            </div>

                            {/* AI Audio Analysis Section */}
                            {(selectedBooking.audioBase64 || selectedBooking.aiAnalysis) && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">psychology</span>
                                            AI Diagnosis Analysis
                                        </label>
                                        {selectedBooking.audioBase64 && !selectedBooking.aiAnalysis && (
                                            <button
                                                onClick={() => handleAnalyze(selectedBooking)}
                                                disabled={isAnalyzing}
                                                className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                                                        Analyze Audio
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {selectedBooking.audioBase64 && (
                                        <div className="mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">mic</span>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Audio Recording</span>
                                            </div>
                                            <audio controls src={`data:audio/wav;base64,${selectedBooking.audioBase64}`} className="w-full h-8" />
                                        </div>
                                    )}

                                    {selectedBooking.aiAnalysis ? (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Complete</span>
                                            </div>
                                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {selectedBooking.aiAnalysis}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                            <span className="material-symbols-outlined text-slate-400 text-2xl mb-2">pending</span>
                                            <p className="text-xs text-slate-400 italic">No analysis performed yet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;
