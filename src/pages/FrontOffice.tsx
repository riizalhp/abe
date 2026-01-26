import React, { useState, useRef } from 'react';
import { Cpu, Mic, StopCircle, Settings, Printer, Upload, Check, FileAudio } from 'lucide-react';
import { ServiceRecord, QueueStatus } from '../../types';
import { analyzeAudioDiagnosis } from '../../services/geminiService';

interface FrontOfficeProps {
    onAddQueue: (data: Partial<ServiceRecord>) => void;
}

const FrontOffice: React.FC<FrontOfficeProps> = ({ onAddQueue }) => {
    const [formData, setFormData] = useState({
        licensePlate: '',
        customerName: '',
        phone: '',
        vehicleModel: '',
        complaint: ''
    });
    const [isRecording, setIsRecording] = useState(false);
    const [aiDiagnosis, setAiDiagnosis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(audioBlob);
                setAudioFileName('Recorded_Audio.wav');

                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result?.toString().split(',')[1];
                    if (base64Audio) {
                        setIsAnalyzing(true);
                        const result = await analyzeAudioDiagnosis(base64Audio);
                        setAiDiagnosis(result);
                        setIsAnalyzing(false);
                    }
                };
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone", err);
            alert("Microphone access denied or not available.");
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
            // Trigger generic analysis if needed or wait for submit
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddQueue({
            ...formData,
            diagnosis: aiDiagnosis || 'Pending Check',
            entryTime: new Date().toISOString(),
            status: QueueStatus.WAITING,
            partsUsed: [],
            serviceCost: 0,
            totalCost: 0
        });
        setFormData({ licensePlate: '', customerName: '', phone: '', vehicleModel: '', complaint: '' });
        setAiDiagnosis('');
        setAudioBlob(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Check-in</h2>
                    <p className="text-slate-500 text-sm">Create new service ticket</p>
                </div>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-mono font-medium tracking-wider shadow-lg shadow-slate-900/20">
                    TICKET #A-{Math.floor(Math.random() * 1000)}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">License Plate</label>
                            <input
                                type="text"
                                name="licensePlate"
                                value={formData.licensePlate}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase font-mono font-semibold"
                                placeholder="B 1234 XYZ"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vehicle Model</label>
                            <input
                                type="text"
                                name="vehicleModel"
                                value={formData.vehicleModel}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Honda Vario 150"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer Name</label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Full Name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone (WA)</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="08..."
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Complaint / Issue</label>
                        <textarea
                            name="complaint"
                            value={formData.complaint}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            placeholder="Describe the issue..."
                            required
                        ></textarea>
                    </div>

                    {/* AI Section */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wide">
                                <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                                AI Acoustic Diagnostic
                            </h3>
                            <div className="flex gap-2">
                                {!isRecording ? (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center shadow-sm"
                                    >
                                        <Mic className="w-3 h-3 mr-2" /> REC
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-100 flex items-center animate-pulse"
                                    >
                                        <StopCircle className="w-3 h-3 mr-2" /> STOP
                                    </button>
                                )}
                                <div className="relative">
                                    <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <button type="button" className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center shadow-sm">
                                        <Upload className="w-3 h-3 mr-2" /> Upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        {audioBlob && (
                            <div className="mb-4 flex items-center text-green-700 text-sm bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                <div className="bg-green-100 p-1 rounded mr-3">
                                    <FileAudio className="w-4 h-4" />
                                </div>
                                <span className="truncate flex-1 font-medium">{audioFileName}</span>
                                <Check className="w-4 h-4 ml-2" />
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="text-sm text-blue-600 flex items-center font-medium bg-blue-50 p-3 rounded-lg">
                                <Settings className="w-4 h-4 mr-3 animate-spin" /> Processing audio profile...
                            </div>
                        )}

                        {!isAnalyzing && aiDiagnosis && (
                            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                <span className="text-xs font-bold text-blue-600 uppercase mb-1 block">AI Analysis Result</span>
                                <p className="text-slate-700 text-sm leading-relaxed">{aiDiagnosis}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20 flex items-center transition-all hover:scale-[1.02]"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Generate Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FrontOffice;
