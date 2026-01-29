import React, { useState, useRef, useEffect } from 'react';
import { analyzeAudioDiagnosis } from '../../services/geminiService';
import { QRISPayment } from '../components/QRISPayment';
import qrisService from '../../services/qrisService';
import timeSlotService, { TimeSlot } from '../../services/timeSlotService';

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
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
    const [paymentProofWebP, setPaymentProofWebP] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load available time slots when component mounts
        const availableSlots = timeSlotService.getActiveTimeSlots();
        setTimeSlots(availableSlots);
    }, []);

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

    // Function to convert image to WebP format
    const convertToWebP = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image to canvas
                ctx?.drawImage(img, 0, 0);
                
                // Convert to WebP with 85% quality
                const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
                resolve(webpDataUrl);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload an image file (JPG, PNG, GIF)');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB');
                return;
            }
            
            setPaymentProof(file);
            
            try {
                // Convert to WebP and create preview
                const webpDataUrl = await convertToWebP(file);
                setPaymentProofWebP(webpDataUrl);
                setPaymentProofPreview(webpDataUrl);
            } catch (error) {
                console.error('Failed to convert image:', error);
                // Fallback to original image
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    setPaymentProofPreview(dataUrl);
                    setPaymentProofWebP(dataUrl);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Get default payment amount from QRIS service
        const defaultAmount = qrisService.getDefaultAmount();
        setPaymentAmount(defaultAmount || 25000); // Fallback to 25000 if no default
        setStep(2);
    };

    const handlePaymentSuccess = () => {
        if (!paymentProof) {
            alert('Please upload payment proof first');
            return;
        }
        
        // Simulating payment process
        setTimeout(() => {
            setStep(3);
        }, 1000);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let audioBase64 = '';
        let paymentProofBase64 = '';
        
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
        
        if (paymentProofWebP) {
            // Use WebP data directly (already base64)
            paymentProofBase64 = paymentProofWebP.split(',')[1] || '';
        }
        
        onSubmit({ 
            ...formData, 
            audioBase64,
            paymentMethod: 'QRIS',
            transferProofBase64: paymentProofBase64, // Reusing same field name
            paymentAmount
        });
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
                                                {timeSlots.length > 0 ? timeSlots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, bookingTime: slot.time})}
                                                        className={`p-2 text-sm rounded-lg border transition-colors ${
                                                            formData.bookingTime === slot.time 
                                                                ? 'bg-primary text-white border-primary' 
                                                                : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                                                        }`}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                )) : (
                                                    <div className="col-span-2 p-4 text-center text-gray-500 text-sm">
                                                        No time slots available. Please contact admin.
                                                    </div>
                                                )}
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

{/* STEP 2: QRIS Payment */}
                    {step === 2 && (
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">QRIS Payment</h3>
                                <p className="text-gray-600">{formData.vehicleModel} - Booking Fee</p>
                                <div className="text-2xl font-bold text-primary mt-2">
                                    {paymentAmount > 0 ? `Rp ${paymentAmount.toLocaleString('id-ID')}` : 'Rp 25,000'}
                                </div>
                            </div>

                            {/* Warning Message */}
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <span className="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold mb-1">⚠️ Penting - Simpan Bukti Pembayaran!</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Screenshot atau foto bukti pembayaran QRIS</li>
                                            <li>Simpan bukti setelah pembayaran berhasil</li>
                                            <li>Upload bukti untuk melanjutkan proses booking</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* QRIS Payment Component */}
                            <div className="mb-6">
                                <QRISPayment
                                    amount={paymentAmount || 25000}
                                    description={`Booking Fee - ${formData.customerName}`}
                                    onPaymentComplete={() => {
                                        // Don't proceed automatically, wait for proof upload
                                        document.getElementById('proof-upload-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    onCancel={() => setStep(1)}
                                />
                            </div>

                            {/* Upload Payment Proof Section */}
                            <div id="proof-upload-section" className="border-t border-gray-200 pt-6">
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Bukti Pembayaran</h4>
                                    <p className="text-sm text-gray-600">
                                        Setelah melakukan pembayaran QRIS, silakan upload screenshot/foto bukti pembayaran
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePaymentProofUpload}
                                            className="hidden"
                                            id="payment-proof-upload"
                                        />
                                        <label htmlFor="payment-proof-upload" className="cursor-pointer">
                                            {paymentProofPreview ? (
                                                <div className="space-y-3">
                                                    <img
                                                        src={paymentProofPreview}
                                                        alt="Payment proof preview"
                                                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                                                    />
                                                    <p className="text-sm text-gray-600">
                                                        {paymentProof?.name} (Converted to WebP)
                                                    </p>
                                                    <p className="text-xs text-primary">Click to change image</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <span className="material-symbols-outlined text-4xl text-gray-400">cloud_upload</span>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-700">Upload Bukti Pembayaran</p>
                                                        <p className="text-sm text-gray-500">JPG, PNG, GIF up to 5MB</p>
                                                        <p className="text-xs text-gray-400 mt-1">Auto-converted to WebP format</p>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    
                                    {paymentProof && (
                                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="material-symbols-outlined text-green-600">check_circle</span>
                                                <span className="text-sm font-medium text-green-800">Payment proof uploaded & converted to WebP</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPaymentProof(null);
                                                    setPaymentProofPreview('');
                                                    setPaymentProofWebP('');
                                                }}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Continue Button */}
                                <button
                                    type="button"
                                    onClick={handlePaymentSuccess}
                                    disabled={!paymentProof}
                                    className={`w-full mt-6 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                                        paymentProof
                                            ? 'bg-primary text-white hover:bg-primary/90'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">verified</span>
                                    {paymentProof ? 'Continue to Next Step' : 'Upload Payment Proof to Continue'}
                                </button>
                            </div>

                            <div className="text-center space-y-2 mt-6">
                                <p className="text-sm text-gray-600">Booking fee akan dipotong dari total servis.</p>
                                <p className="text-xs text-gray-500">Refundable up to 24 hours before appointment.</p>
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
