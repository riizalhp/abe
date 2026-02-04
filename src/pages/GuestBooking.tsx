import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analyzeAudioDiagnosis } from '../../services/geminiService';
import { MootaPayment } from '../components/MootaPayment';
import { QRISUploader } from '../components/QRISUploader';
import { QRISPayment } from '../components/QRISPayment';
import mootaService from '../../services/mootaService';
import qrisService from '../../services/qrisService';
import timeSlotService, { TimeSlot } from '../../services/timeSlotService';
import workshopService, { PublicWorkshopInfo } from '../../services/workshopService';
import { PaymentMethod } from '../../types';

interface GuestBookingProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
}

const GuestBooking: React.FC<GuestBookingProps> = ({ onSubmit, onBack }) => {
    const { workshopSlug, branchCode } = useParams<{ workshopSlug?: string; branchCode?: string }>();
    
    const [step, setStep] = useState(1);
    const [branchId, setBranchId] = useState<string | null>(null);
    const [branchName, setBranchName] = useState<string | null>(null);
    const [workshop, setWorkshop] = useState<PublicWorkshopInfo | null>(null);
    const [workshopLoading, setWorkshopLoading] = useState(true);
    const [workshopError, setWorkshopError] = useState<string | null>(null);
    
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
    const [paymentAmount, setPaymentAmount] = useState<number>(25000);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
    const [paymentProofWebP, setPaymentProofWebP] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [bookingOrderId, setBookingOrderId] = useState<string>('');
    const [isPaid, setIsPaid] = useState(false);
    const [mootaConfigured, setMootaConfigured] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load workshop and branch info if slug is provided
    useEffect(() => {
        const loadWorkshop = async () => {
            setWorkshopLoading(true);
            setWorkshopError(null);
            
            if (workshopSlug) {
                const info = await workshopService.getPublicWorkshopInfo(workshopSlug);
                if (info) {
                    setWorkshop(info);
                    
                    // If branchCode is provided, find the branch
                    if (branchCode) {
                        const branch = await workshopService.getBranchByCode(info.id, branchCode);
                        if (branch) {
                            setBranchId(branch.id);
                            setBranchName(branch.name);
                            
                            // Load time slots for this specific branch
                            const slots = await workshopService.getWorkshopTimeSlots(info.id, branch.id);
                            if (slots.length > 0) {
                                setTimeSlots(slots.map(s => ({
                                    id: s.id,
                                    time: s.startTime,
                                    label: `${s.startTime} - ${s.endTime}`,
                                    maxBookings: s.maxBookings,
                                    isActive: s.isActive,
                                    dayOfWeek: []
                                })));
                            } else {
                                const defaultSlots = timeSlotService.getActiveTimeSlots();
                                setTimeSlots(defaultSlots);
                            }
                            
                            // Check Moota config for this branch
                            const mootaSettings = await workshopService.getWorkshopMootaSettings(info.id, branch.id);
                            setMootaConfigured(!!mootaSettings);
                        } else {
                            setWorkshopError('Cabang tidak ditemukan');
                        }
                    } else {
                        // No branch code - load default/all workshop slots
                        const slots = await workshopService.getWorkshopTimeSlots(info.id);
                        
                        if (slots.length > 0) {
                            setTimeSlots(slots.map(s => ({
                                id: s.id,
                                time: s.startTime,
                                label: `${s.startTime} - ${s.endTime}`,
                                maxBookings: s.maxBookings,
                                isActive: s.isActive,
                                dayOfWeek: []
                            })));
                        } else {
                            const defaultSlots = timeSlotService.getActiveTimeSlots();
                            setTimeSlots(defaultSlots);
                        }
                        
                        // Check Moota config for this workshop
                        const mootaSettings = await workshopService.getWorkshopMootaSettings(info.id);
                        setMootaConfigured(!!mootaSettings);
                    }
                } else {
                    setWorkshopError('Workshop tidak ditemukan');
                }
            } else {
                // Default workshop (backward compatibility)
                const availableSlots = timeSlotService.getActiveTimeSlots();
                setTimeSlots(availableSlots);
                const settings = await mootaService.getActiveSettings();
                setMootaConfigured(!!settings);
            }
            
            setWorkshopLoading(false);
        };
        
        loadWorkshop();
    }, [workshopSlug, branchCode]);

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
        // Generate unique order ID for this booking
        const orderId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setBookingOrderId(orderId);
        setPaymentAmount(25000); // Booking fee
        setStep(2);
    };

    const handlePaymentComplete = (order?: any) => {
        setIsPaid(true);
        if (order) {
            console.log('Payment confirmed via Moota:', order);
        }
        setStep(3);
    };

    const handlePaymentSuccess = () => {
        if (!isPaid && !paymentProof) {
            alert('Please complete payment or upload payment proof first');
            return;
        }
        setStep(3);
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
            paymentMethod: isPaid ? 'MOOTA' : 'TRANSFER',
            transferProofBase64: paymentProofBase64, // Reusing same field name
            paymentAmount,
            orderId: bookingOrderId,
            // Multi-tenant: include workshop and branch info
            workshopId: workshop?.id || null,
            workshopSlug: workshop?.slug || workshopSlug || null,
            branchId: branchId || null,
            branchCode: branchCode || null,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            {workshop?.logoUrl ? (
                                <img src={workshop.logoUrl} alt={workshop.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                                <div className="p-2 bg-primary rounded-lg">
                                    <span className="material-symbols-outlined text-white text-xl">local_car_wash</span>
                                </div>
                            )}
                            <h1 className="text-xl font-bold text-gray-900">{workshop?.name || 'ABE'}</h1>
                        </div>
                        <button onClick={onBack} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-200">
                            Back
                        </button>
                    </div>
                </div>
            </nav>

            {/* Loading State */}
            {workshopLoading && (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat informasi bengkel...</p>
                    </div>
                </div>
            )}

            {/* Workshop Not Found Error */}
            {workshopError && (
                <div className="max-w-md mx-auto px-4 py-16 text-center">
                    <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Workshop Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-6">{workshopError}</p>
                    <button onClick={onBack} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90">
                        Kembali ke Beranda
                    </button>
                </div>
            )}

            {/* Main Content - only show if not loading and no error */}
            {!workshopLoading && !workshopError && (
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Workshop Info Banner */}
                {workshop && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-6 border border-primary/20">
                        <div className="flex items-center gap-3">
                            {workshop.logoUrl ? (
                                <img src={workshop.logoUrl} alt={workshop.name} className="h-12 w-12 rounded-lg object-cover" />
                            ) : (
                                <div className="p-2 bg-primary rounded-lg">
                                    <span className="material-symbols-outlined text-white">storefront</span>
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-gray-900">{workshop.name}</h3>
                                {branchName && (
                                    <p className="text-sm font-medium text-primary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        Cabang: {branchName}
                                    </p>
                                )}
                                {workshop.address && <p className="text-sm text-gray-600">{workshop.address}</p>}
                            </div>
                        </div>
                    </div>
                )}

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

{/* STEP 2: Dynamic Payment based on Workshop Settings */}
                    {step === 2 && (
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Payment</h3>
                                <p className="text-gray-600">{formData.vehicleModel} - Booking Fee</p>
                                <p className="text-lg font-bold text-primary mt-2">Rp {paymentAmount.toLocaleString('id-ID')}</p>
                            </div>

                            {/* Dynamic Payment Method */}
                            {workshop?.payment_method === PaymentMethod.MOOTA && mootaConfigured ? (
                                <>
                                    {/* Moota Payment Component */}
                                    <MootaPayment
                                        amount={paymentAmount}
                                        orderId={bookingOrderId}
                                        customerName={formData.customerName}
                                        customerPhone={formData.phone}
                                        description={`Booking Fee - ${formData.vehicleModel} - ${formData.licensePlate}`}
                                        onPaymentComplete={handlePaymentComplete}
                                        onPaymentExpired={() => {
                                            alert('Payment expired. Please try again.');
                                            setStep(1);
                                        }}
                                        onCancel={() => setStep(1)}
                                        autoCheck={true}
                                        checkInterval={30}
                                    />
                                    
                                    <div className="text-center space-y-2 mt-6">
                                        <p className="text-sm text-gray-600">Booking fee akan dipotong dari total servis.</p>
                                        <p className="text-xs text-gray-500">Refundable up to 24 hours before appointment.</p>
                                    </div>
                                </>
                            ) : workshop?.payment_method === PaymentMethod.QRIS_DYNAMIC ? (
                                <>
                                    {/* QRIS Dynamic Payment */}
                                    <QRISPayment
                                        amount={paymentAmount}
                                        orderId={bookingOrderId}
                                        description={`Booking Fee - ${formData.vehicleModel}`}
                                        onPaymentSuccess={handlePaymentComplete}
                                        onCancel={() => setStep(1)}
                                    />
                                    
                                    <div className="text-center space-y-2 mt-6">
                                        <p className="text-sm text-gray-600">Scan QRIS code dengan aplikasi mobile banking Anda.</p>
                                        <p className="text-xs text-gray-500">Booking fee akan dipotong dari total servis.</p>
                                    </div>
                                </>
                            ) : workshop?.payment_method === PaymentMethod.QRIS_STATIC ? (
                                <>
                                    {/* QRIS Static Payment */}
                                    <QRISUploader
                                        onQrDecode={(data, error) => {
                                            if (error) {
                                                alert(`QRIS Error: ${error}`);
                                                return;
                                            }
                                            // Handle static QRIS payment
                                            handlePaymentSuccess();
                                        }}
                                        maxFileSize={5}
                                    />
                                    
                                    <div className="text-center space-y-2 mt-6">
                                        <p className="text-sm text-gray-600">Scan QRIS code yang tersedia di bengkel atau upload foto QRIS.</p>
                                        <p className="text-xs text-gray-500">Pastikan transfer sesuai nominal yang tertera.</p>
                                    </div>
                                </>
                            ) : (
                                /* Manual Payment */
                                <>
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start space-x-3">
                                            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                                            <div className="text-sm text-blue-800">
                                                <p className="font-semibold mb-1">Manual Payment</p>
                                                <p>Silakan lakukan pembayaran sesuai instruksi bengkel dan upload bukti pembayaran.</p>
                                                <p className="mt-2 font-bold text-lg">Total: Rp {paymentAmount.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Payment Proof Section */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Bukti Pembayaran</h4>
                                            <p className="text-sm text-gray-600">
                                                Setelah melakukan pembayaran, silakan upload screenshot/foto bukti pembayaran
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
                                                            </div>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                            
                                            {paymentProof && (
                                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                                                        <span className="text-sm font-medium text-green-800">Payment proof uploaded</span>
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

                                    <div className="flex justify-start mt-4">
                                        <button type="button" onClick={() => setStep(1)} className="px-6 py-2 text-gray-600 hover:text-gray-800">
                                            ← Back
                                        </button>
                                    </div>
                                </>
                            )}
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
            )}
        </div>
    );
};

export default GuestBooking;
