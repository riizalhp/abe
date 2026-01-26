import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { ServiceRecord, ServiceReminder } from '../../types';
import { predictServiceSchedule, generateMarketingMessage } from '../../services/geminiService';
import { reminderService } from '../../services/reminderService';

interface CRMProps {
    history: ServiceRecord[];
    reminders: ServiceReminder[];
    setReminders: (reminders: ServiceReminder[]) => void;
}

const CRM: React.FC<CRMProps> = ({ history, reminders, setReminders }) => {
    const [generating, setGenerating] = useState<string | null>(null);

    const runAutoScheduler = async () => {
        // In a real app this would probably process logic on backend or comprehensive frontend logic.
        // For now we just mock the AI alert.
        const historyText = history.slice(0, 3).map(h => `${h.vehicleModel} (${h.finishTime}) - ${h.diagnosis}`).join('; ');
        const prediction = await predictServiceSchedule(historyText);
        alert(`AI Prediction: ${prediction}`);
    };

    const handleGenerateMessage = async (reminder: ServiceReminder) => {
        setGenerating(reminder.id);
        try {
            const msg = await generateMarketingMessage(reminder.customerName, reminder.vehicleModel, new Date(reminder.lastServiceDate).toLocaleDateString(), reminder.serviceType);
            await reminderService.update(reminder.id, { messageTemplate: msg });

            const updatedReminders = reminders.map(r => r.id === reminder.id ? { ...r, messageTemplate: msg } : r);
            setReminders(updatedReminders);
        } catch (e) {
            console.error(e);
            alert("Failed to save message template");
        }
        setGenerating(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-slate-900">CRM</h2><p className="text-slate-500 text-sm">Automated Reminders</p></div>
                <button onClick={runAutoScheduler} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center text-sm font-bold"><CalendarClock className="w-4 h-4 mr-2" /> Auto-Schedule</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reminders.map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${new Date(r.nextServiceDate) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-slate-900">{r.customerName}</h3>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">{r.status}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">{r.vehicleModel} • {new Date(r.nextServiceDate).toLocaleDateString()}</p>
                        {r.messageTemplate && <div className="bg-slate-50 p-3 rounded-lg text-xs italic text-slate-500 mb-4 border border-slate-200">"{r.messageTemplate.substring(0, 50)}..."</div>}
                        <div className="flex gap-2">
                            <button onClick={() => handleGenerateMessage(r)} disabled={generating === r.id} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">{generating === r.id ? '...' : 'Draft AI'}</button>
                            <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md shadow-green-600/20">WhatsApp</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CRM;
