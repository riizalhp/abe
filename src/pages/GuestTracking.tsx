import React, { useState, useEffect } from 'react';
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
        <div className="min-h-screen bg-gray-50">
            {/* Header Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <span className="material-symbols-outlined text-white text-xl">local_car_wash</span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">ABE</h1>
                        </div>
                        <button onClick={onBack} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
                            Back to App
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start">
                        <span className="material-symbols-outlined text-emerald-600 mr-3 mt-0.5">check_circle</span>
                        <div>
                            <h3 className="font-semibold text-lg">Booking Successful!</h3>
                            <p className="text-sm mt-1">Your booking <span className="font-mono font-bold bg-emerald-100 px-2 py-1 rounded">{initialCode}</span> has been created. Track your service status below.</p>
                        </div>
                    </div>
                )}

                {/* Search Section */}
                {!foundBooking && (
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Service</h2>
                        <p className="text-gray-600 mb-6">Enter your booking code to check the status</p>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking Code</label>
                                    <input
                                        type="text"
                                        value={searchCode}
                                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                                        placeholder="BK-XXXX"
                                        className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-wider uppercase focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                    Track Status
                                </button>
                            </form>
                        </div>

                        {searched && !foundBooking && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-center max-w-md mx-auto">
                                <span className="material-symbols-outlined mr-2">error</span>
                                Booking <span className="font-mono font-bold">{searchCode}</span> not found.
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Details */}
                {foundBooking && (
                    <div className="space-y-6">
                        {/* Live Tracking Header */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                LIVE TRACKING
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                Booking #{foundBooking.bookingCode}
                            </h1>
                            <p className="text-gray-600">Last updated: Just now</p>
                        </div>

                        {/* Progress Steps */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-8">
                                {[
                                    { 
                                        label: 'Booked', 
                                        status: 'completed', 
                                        icon: 'event' 
                                    },
                                    { 
                                        label: 'Approved', 
                                        status: foundBooking.status === BookingStatus.CONFIRMED ? 'completed' : 
                                               foundBooking.status === BookingStatus.REJECTED ? 'rejected' : 
                                               foundBooking.status === BookingStatus.CHECKED_IN ? 'completed' : 'pending', 
                                        icon: 'check_circle' 
                                    },
                                    { 
                                        label: 'On Service', 
                                        status: foundBooking.status === BookingStatus.CHECKED_IN ? 'completed' : 'pending', 
                                        icon: 'build' 
                                    },
                                    { 
                                        label: 'Done', 
                                        status: 'pending', 
                                        icon: 'flag' 
                                    }
                                ].map((step, index) => (
                                    <div key={step.label} className="flex-1 flex flex-col items-center relative">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                            step.status === 'completed' ? 'bg-primary text-white' :
                                            step.status === 'rejected' ? 'bg-red-500 text-white' :
                                            'bg-gray-200 text-gray-400'
                                        }`}>
                                            <span className="material-symbols-outlined">
                                                {step.status === 'completed' ? 'check' : 
                                                 step.status === 'rejected' ? 'close' : step.icon}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-medium ${
                                            step.status === 'completed' ? 'text-primary' :
                                            step.status === 'rejected' ? 'text-red-500' :
                                            'text-gray-500'
                                        }`}>
                                            {step.label}
                                        </p>
                                        {index < 3 && (
                                            <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                                                step.status === 'completed' ? 'bg-primary' : 'bg-gray-200'
                                            }`} style={{ transform: 'translateX(50%)', zIndex: -1 }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Status */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-2xl">two_wheeler</span>
                                        <div className="absolute -mt-2 -mr-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-xs">check</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {foundBooking.status === BookingStatus.CONFIRMED ? 'Booking Approved - Ready for Service' :
                                         foundBooking.status === BookingStatus.CHECKED_IN ? 'Check-In Complete - Service in Progress' :
                                         foundBooking.status === BookingStatus.REJECTED ? 'Booking Rejected' :
                                         'Waiting for Approval'}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {foundBooking.status === BookingStatus.CONFIRMED ? 'Your booking has been confirmed. Please arrive at the scheduled time.' :
                                         foundBooking.status === BookingStatus.CHECKED_IN ? 'You have checked in and your vehicle is now being serviced by our team.' :
                                         foundBooking.status === BookingStatus.REJECTED ? 'Unfortunately, your booking has been rejected. Please contact us for more information.' :
                                         'Your booking is being reviewed by our team. You will be notified once approved.'}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">SCHEDULED TIME</span>
                                            <p className="font-semibold text-gray-900">{foundBooking.bookingDate} at {foundBooking.bookingTime}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                        View Details
                                    </button>
                                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">phone</span>
                                        Contact Advisor
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    <h3 className="font-semibold text-gray-900">Vehicle Information</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Owner:</span>
                                        <span className="font-medium text-gray-900">{foundBooking.customerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">License Plate:</span>
                                        <span className="font-medium text-gray-900 font-mono">{foundBooking.licensePlate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Vehicle:</span>
                                        <span className="font-medium text-gray-900">{foundBooking.vehicleModel}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <span className="text-gray-500 block mb-2">Complaint:</span>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">"{foundBooking.complaint}"</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-primary">location_on</span>
                                    <h3 className="font-semibold text-gray-900">Service Location</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">Schedule a drop-off location nearby.</p>
                                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                    Set Pickup Location
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="material-symbols-outlined text-primary">local_car_wash</span>
                            <span className="text-sm">© 2026 ABE Services</span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-600">
                            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-900">Terms of Service</a>
                            <a href="#" className="hover:text-gray-900">Support</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GuestTracking;
