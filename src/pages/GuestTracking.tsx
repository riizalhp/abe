import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Activity, Star } from 'lucide-react';
import { BookingRecord, BookingStatus } from '../../types';

interface GuestTrackingProps {
    bookings: BookingRecord[];
    onBack: () => void;
    initialCode?: string;
}

const GuestTracking: React.FC<GuestTrackingProps> = ({ bookings, onBack, initialCode }) => {
    const [searchCode, setSearchCode] = useState(initialCode || '');
    const [foundBooking, setFoundBooking] = useState<BookingRecord | null>(null);
    const [searched, setSearched] = useState(false);
    const [showSuccess, setShowSuccess] = useState(!!initialCode);

    useEffect(() => {
        if (initialCode) {
            const booking = bookings.find(b => b.bookingCode === initialCode);
            if (booking) {
                setFoundBooking(booking);
                setSearched(true);
                setShowSuccess(true);
            }
        }
    }, [initialCode, bookings]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuccess(false);
        const booking = bookings.find(b => b.bookingCode === searchCode.trim().toUpperCase());
        setFoundBooking(booking || null);
        setSearched(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pt-20">
            <div className="w-full max-w-md">
                <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center mb-8 font-medium transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
                </button>

                {showSuccess && (
                    <div className="mb-6 bg-emerald-500 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-start animate-in slide-in-from-top-4 duration-500">
                        <div className="bg-white/20 p-2 rounded-full mr-4 mt-0.5">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Booking Successful!</h3>
                            <p className="text-white/90 text-sm mt-1">Your ticket <span className="font-mono font-bold bg-white/20 px-1 rounded">{initialCode}</span> has been generated. Use this code to track your service status.</p>
                        </div>
                    </div>
                )}

                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center justify-center">
                    <Activity className="w-6 h-6 mr-2 text-blue-600" /> Track Service
                </h2>

                <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 mb-6">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Booking Code</label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                                placeholder="BK-XXXX"
                                className="w-full p-4 border border-slate-200 rounded-xl text-center text-xl font-mono tracking-widest uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                            Track Status
                        </button>
                    </form>
                </div>

                {searched && !foundBooking && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100 text-sm font-medium">
                        Booking <span className="font-mono font-bold">{searchCode}</span> not found.
                    </div>
                )}

                {foundBooking && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-4">
                        <div className={`p-4 text-white text-center font-bold tracking-wider text-sm ${foundBooking.status === BookingStatus.CONFIRMED ? 'bg-green-600' :
                            foundBooking.status === BookingStatus.REJECTED ? 'bg-red-600' :
                                'bg-amber-500'
                            }`}>
                            {foundBooking.status === BookingStatus.PENDING ? 'WAITING APPROVAL' : foundBooking.status}
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6 text-sm pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Owner</p>
                                    <p className="font-semibold text-slate-900 text-lg">{foundBooking.customerName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Schedule</p>
                                    <p className="font-semibold text-slate-900">{foundBooking.bookingDate}</p>
                                    <p className="font-mono text-xs text-slate-500">{foundBooking.bookingTime}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Vehicle</p>
                                    <p className="font-semibold text-slate-900">{foundBooking.licensePlate}</p>
                                    <p className="text-xs text-slate-500">{foundBooking.vehicleModel}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-2">Complaint Note</p>
                                <p className="text-slate-600 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100">"{foundBooking.complaint}"</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuestTracking;
