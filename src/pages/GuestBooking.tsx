import React, { useState, useRef } from 'react';
import { CreditCard, CheckCircle, Cpu, Mic, StopCircle, Upload, FileAudio, Check, X } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans">
            <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[600px] border border-slate-100">

                {/* Header */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h2 className="text-2xl font-bold tracking-tight">Book Service</h2>
                        <button onClick={onBack} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Minimalist Stepper */}
                    <div className="flex items-center gap-4 relative z-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${step >= i
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-transparent border-slate-600 text-slate-500'
                                    }`}>
                                    {step > i ? <Check className="w-5 h-5" /> : i}
                                </div>
                                {i < 3 && <div className={`h-0.5 flex-1 mx-4 transition-all duration-500 ${step > i ? 'bg-blue-600' : 'bg-slate-700'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 flex-1 bg-white">
                    {/* STEP 1: Details */}
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                                    <input type="text" name="customerName" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.customerName} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">WhatsApp</label>
                                    <input type="tel" name="phone" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.phone} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">License Plate</label>
                                    <input type="text" name="licensePlate" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none uppercase font-mono" onChange={handleInputChange} value={formData.licensePlate} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Model</label>
                                    <input type="text" name="vehicleModel" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.vehicleModel} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                                    <input type="date" name="bookingDate" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.bookingDate} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time</label>
                                    <input type="time" name="bookingTime" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" onChange={handleInputChange} value={formData.bookingTime} />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                                    Continue to Payment
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Payment */}
                    {step === 2 && (
                        <div className="text-center space-y-8 py-10">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                                <CreditCard className="w-10 h-10 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Booking Deposit</h3>
                                <p className="text-slate-500 mt-2">Secure your slot with a standard fee.</p>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto">
                                <div className="flex justify-between font-bold text-2xl text-slate-900">
                                    <span>Total</span>
                                    <span>Rp 10.000</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePaymentSuccess}
                                className="w-full max-w-sm bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center mx-auto"
                            >
                                <CreditCard className="w-5 h-5 mr-3" /> Simulate Payment
                            </button>
                        </div>
                    )}

                    {/* STEP 3: Diagnostics */}
                    {step === 3 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-6">
                            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg flex items-center text-sm font-medium">
                                <CheckCircle className="w-5 h-5 mr-3" />
                                Payment Successful. Please provide vehicle details.
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Details & Symptoms</label>
                                <textarea name="complaint" rows={3} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Describe the issue..." onChange={handleInputChange} value={formData.complaint}></textarea>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                                <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                                    <div className="bg-blue-100 p-1.5 rounded mr-3">
                                        <Cpu className="w-4 h-4 text-blue-600" />
                                    </div>
                                    AI Acoustic Input
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        {isRecording ? (
                                            <button type="button" onClick={stopRecording} className="w-full py-6 border-2 border-red-100 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex flex-col items-center justify-center animate-pulse">
                                                <StopCircle className="w-8 h-8 mb-2" /> <span className="text-xs font-bold uppercase">Stop</span>
                                            </button>
                                        ) : (
                                            <button type="button" onClick={startRecording} className="w-full py-6 border-2 border-slate-200 bg-white text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all flex flex-col items-center justify-center group">
                                                <Mic className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold uppercase">Record Engine</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 relative">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="audio/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full h-full py-6 border-2 border-slate-200 bg-white text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-xs font-bold uppercase">Upload Audio</span>
                                        </div>
                                    </div>
                                </div>

                                {audioBlob && (
                                    <div className="mt-4 flex items-center text-green-700 text-sm bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                        <div className="bg-green-100 p-1 rounded mr-3">
                                            <FileAudio className="w-4 h-4" />
                                        </div>
                                        <span className="truncate flex-1 font-medium">{audioFileName || 'Audio Captured'}</span>
                                        <Check className="w-4 h-4 ml-2" />
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                                Confirm Booking
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestBooking;
