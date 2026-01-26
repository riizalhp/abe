import React, { useState } from 'react';
import { Calendar, X, Bot } from 'lucide-react';
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div><h2 className="text-2xl font-bold text-slate-900">Booking Requests</h2><p className="text-slate-500 text-sm">Online Confirmations</p></div>
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-slate-500 font-bold text-xs uppercase"><th className="p-5">Date</th><th className="p-5">Customer</th><th className="p-5">Details</th><th className="p-5">Status</th><th className="p-5"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50">
                                <td className="p-5 font-bold text-slate-900">{b.bookingDate}</td>
                                <td className="p-5">{b.customerName}<div className="text-xs text-slate-400">{b.vehicleModel}</div></td>
                                <td className="p-5 text-slate-600 truncate max-w-xs">{b.complaint}</td>
                                <td className="p-5">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === BookingStatus.CONFIRMED ? 'bg-blue-100 text-blue-700' :
                                        b.status === BookingStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                            b.status === BookingStatus.CHECKED_IN ? 'bg-green-100 text-green-700' :
                                                'bg-amber-100 text-amber-700'
                                        }`}>
                                        {b.status === BookingStatus.CHECKED_IN ? 'DONE' : b.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <button
                                        onClick={() => setSelectedBooking(b)}
                                        className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">Booking Review</h3>
                                <p className="text-slate-500 text-sm font-mono mt-1">{selectedBooking.bookingCode}</p>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-900 transition-colors bg-white p-2 rounded-full shadow-sm border border-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Grid Info */}
                            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
                                    <p className="font-bold text-slate-900">{selectedBooking.customerName}</p>
                                    <p className="text-sm text-slate-500">{selectedBooking.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Vehicle</p>
                                    <p className="font-bold text-slate-900">{selectedBooking.licensePlate}</p>
                                    <p className="text-sm text-slate-500">{selectedBooking.vehicleModel}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Schedule</p>
                                        <div className="flex items-center text-slate-700 font-medium">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                            {selectedBooking.bookingDate} <span className="mx-2 text-slate-300">|</span> {selectedBooking.bookingTime}
                                        </div>
                                    </div>
                                    {/* Actions for Status Update */}
                                    {selectedBooking.status === BookingStatus.PENDING && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.REJECTED)} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200">Reject</button>
                                            <button onClick={() => handleUpdateStatus(selectedBooking.id, BookingStatus.CONFIRMED)} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow-sm">Confirm</button>
                                        </div>
                                    )}
                                    {selectedBooking.status === BookingStatus.CONFIRMED && (
                                        <button onClick={() => handleCheckIn(selectedBooking)} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-600/20">Check In (To Queue)</button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 p-4 rounded-xl">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer Complaint</p>
                                <p className="text-slate-800 italic">"{selectedBooking.complaint}"</p>
                            </div>

                            {/* AI Audio Analysis Section */}
                            {(selectedBooking.audioBase64 || selectedBooking.aiAnalysis) && (
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            <Bot className="w-3 h-3 mr-2" /> AI Diagnosis
                                        </p>
                                        {selectedBooking.audioBase64 && !selectedBooking.aiAnalysis && (
                                            <button
                                                onClick={() => handleAnalyze(selectedBooking)}
                                                disabled={isAnalyzing}
                                                className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:opacity-50"
                                            >
                                                {isAnalyzing ? 'Analyzing...' : 'Analyze Audio'}
                                            </button>
                                        )}
                                    </div>

                                    {selectedBooking.audioBase64 && (
                                        <div className="mb-4">
                                            <audio controls src={`data:audio/wav;base64,${selectedBooking.audioBase64}`} className="w-full h-8" />
                                        </div>
                                    )}

                                    {selectedBooking.aiAnalysis ? (
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed">
                                            {selectedBooking.aiAnalysis}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No analysis performed yet.</p>
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
