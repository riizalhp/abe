import React, { useState, useRef } from 'react';
import { analyzeAudioDiagnosis } from '../../services/geminiService';

interface GuestBookingProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const GuestBooking: React.FC<GuestBookingProps> = ({ onSubmit, onBack }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        licensePlate: '',
        vehicleModel: '',
        bookingDate: '',
        bookingTime: '',
        complaint: ''
    });
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioFileName, setAudioFileName] = useState<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                setAudioFileName('Engine_Audio_Sample.wav');
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error", err);
            alert("No mic access.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioBlob(file);
            setAudioFileName(file.name);
        }
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handlePaymentSuccess = () => {
        // Simulating payment process
        setTimeout(() => {
            setStep(3);
        }, 1000);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let audioBase64 = '';
        if (audioBlob) {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            await new Promise(resolve => {
                reader.onloadend = () => {
                    audioBase64 = reader.result?.toString().split(',')[1] || '';
                    resolve(null);
                };
            });
        }
        onSubmit({ ...formData, audioBase64 });
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
                        <button onClick={onBack} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-200">
                            Back
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                step >= i ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                                {i}
                            </div>
                            {i < 3 && <div className="w-16 h-px bg-gray-300 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="w-12 h-1 bg-primary rounded-full mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Service</h2>
                        <p className="text-gray-600">
                            {step === 1 ? 'Isi data kendaraan Anda untuk memulai booking.' :
                             step === 2 ? 'Konfirmasi pembayaran untuk booking Anda.' :
                             'Deskripsikan keluhan kendaraan Anda.'}
                        </p>
                    </div>
                    {/* STEP 1: Customer Details */}
                    {step === 1 && (
                        <div className="p-6">
                            <form onSubmit={handleStep1Submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                        <input 
                                            type="text" 
                                            name="customerName" 
                                            required 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                                            placeholder="Masukkan nama lengkap"
                                            onChange={handleInputChange} 
                                            value={formData.customerName} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                                        <input 
                                            type="tel" 
                                            name="phone" 
                                            required 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                                            placeholder="08xxxxxxxxxx"
                                            onChange={handleInputChange} 
                                            value={formData.phone} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Nomor Polisi</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 material-symbols-outlined text-gray-400">pin</span>
                                            <input 
                                                type="text" 
                                                name="licensePlate" 
                                                required 
                                                className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none uppercase font-mono" 
                                                placeholder="B 1234 XYZ"
                                                onChange={handleInputChange} 
                                                value={formData.licensePlate} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Model Kendaraan</label>
                                        <input 
                                            type="text" 
                                            name="vehicleModel" 
                                            required 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                            placeholder="Honda Beat, Yamaha Vario, dll"
                                            onChange={handleInputChange} 
                                            value={formData.vehicleModel}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700">Jadwal Servis</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <input 
                                                type="date" 
                                                name="bookingDate" 
                                                required 
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                                                onChange={handleInputChange} 
                                                value={formData.bookingDate}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm text-gray-600 mb-2">Available Slots</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['09:00', '10:30', '01:00', '03:30'].map((time, idx) => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, bookingTime: time})}
                                                        className={`p-2 text-sm rounded-lg border transition-colors ${
                                                            formData.bookingTime === time 
                                                                ? 'bg-primary text-white border-primary' 
                                                                : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                                                        }`}
                                                    >
                                                        {time} {idx < 2 ? 'AM' : 'PM'}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 mt-2">
                                                <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                                                Estimated duration: 1h 30m
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={onBack} className="px-6 py-2 text-gray-600 hover:text-gray-800">
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                                    >
                                        Lanjut
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* STEP 2: Payment Confirmation */}
                    {step === 2 && (
                        <div className="p-6">
                            <div className="text-center space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Confirm Payment</h3>
                                    <p className="text-gray-600">{formData.vehicleModel} - Full Service Package</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-4xl font-bold text-gray-900">Rp 25.000</div>
                                    <div className="flex items-center justify-center gap-1 text-green-600">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        <span className="text-sm font-medium">Verified Price</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">VISA</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">Visa ending in 4242</div>
                                            <div className="text-xs text-gray-500">Expires 12/25</div>
                                        </div>
                                        <button className="text-primary text-sm font-medium">Edit</button>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-sm text-gray-600">Deposit akan dipotong dari total servis.</p>
                                    <p className="text-xs text-gray-500">Refundable up to 24 hours before appointment.</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handlePaymentSuccess}
                                        className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">lock</span>
                                        Pay Now
                                    </button>
                                    
                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                        <span className="material-symbols-outlined text-sm">security</span>
                                        SSL SECURED PAYMENT
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 text-center">
                                    By booking, you agree to our Terms of Service. Need help? Call Support at 1-800-AUTO
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Vehicle Issues & Audio */}
                    {step === 3 && (
                        <div className="p-6">
                            <form onSubmit={handleFinalSubmit} className="space-y-6">
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center text-sm">
                                    <span className="material-symbols-outlined text-green-600 mr-3">check_circle</span>
                                    Payment Successful. Please provide vehicle details.
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Vehicle Issues & Symptoms</label>
                                    <textarea 
                                        name="complaint" 
                                        rows={4} 
                                        required 
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" 
                                        placeholder="Describe the issue in detail..." 
                                        onChange={handleInputChange} 
                                        value={formData.complaint}
                                    />
                                    <div className="flex items-center text-xs text-gray-500">
                                        <span className="material-symbols-outlined text-sm mr-1">info</span>
                                        Be as detailed as possible to help our mechanics prepare
                                    </div>
                                </div>

                                {/* Audio Recording Section */}
                                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                                    <h3 className="font-medium text-gray-900 mb-4">Audio Recording</h3>
                                    <p className="text-sm text-gray-600 mb-4">Record engine sound or upload audio file</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {isRecording ? (
                                                <button 
                                                    type="button" 
                                                    onClick={stopRecording} 
                                                    className="w-full p-4 border-2 border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex flex-col items-center justify-center space-y-2"
                                                >
                                                    <span className="material-symbols-outlined text-2xl animate-pulse">stop</span>
                                                    <span className="text-sm font-medium">Stop Recording</span>
                                                </button>
                                            ) : (
                                                <button 
                                                    type="button" 
                                                    onClick={startRecording} 
                                                    className="w-full p-4 border-2 border-gray-300 bg-white text-gray-700 rounded-lg hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center space-y-2 group"
                                                >
                                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">mic</span>
                                                    <span className="text-sm font-medium">Record Engine Sound</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="audio/*"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full h-full p-4 border-2 border-gray-300 bg-white text-gray-700 rounded-lg hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center space-y-2">
                                                <span className="material-symbols-outlined text-2xl">upload</span>
                                                <span className="text-sm font-medium">Upload Audio File</span>
                                            </div>
                                        </div>
                                    </div>

                                    {audioBlob && (
                                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-600">audio_file</span>
                                            <span className="flex-1 text-sm font-medium text-gray-900">{audioFileName || 'Audio Recorded Successfully'}</span>
                                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">check</span>
                                        Confirm Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestBooking;
