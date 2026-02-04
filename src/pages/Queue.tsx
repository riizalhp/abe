import React, { useState } from 'react';
import { Clock, Car, Wrench, CheckCircle, AlertCircle, User } from 'lucide-react';
import { ServiceRecord, QueueStatus, User as UserType, Role } from '../../types';

interface QueueProps {
  queue: ServiceRecord[];
  updateStatus: (id: string, status: QueueStatus, mechanicId?: string) => void;
  users: UserType[];
}

const Queue: React.FC<QueueProps> = ({ queue, updateStatus, users }) => {
  const [filter, setFilter] = useState<'ALL' | QueueStatus>('ALL');
  const [selectedMechanic, setSelectedMechanic] = useState<{ [jobId: string]: string }>({});
  const [showMechanicSelect, setShowMechanicSelect] = useState<string | null>(null);

  // Get only mechanics from users
  const mechanics = users.filter(u => u.role === Role.MEKANIK);

  // Check if mechanic has active job
  const getMechanicActiveJob = (mechanicId: string) => {
    return queue.find(
      q => q.mechanicId === mechanicId && 
           (q.status === QueueStatus.PROCESS || q.status === QueueStatus.PENDING)
    );
  };

  const handleStartJob = (jobId: string) => {
    const mechId = selectedMechanic[jobId];
    if (!mechId) {
      alert('Pilih mekanik terlebih dahulu');
      return;
    }
    updateStatus(jobId, QueueStatus.PROCESS, mechId);
    setShowMechanicSelect(null);
    setSelectedMechanic(prev => ({ ...prev, [jobId]: '' }));
  };

  const filteredQueue = filter === 'ALL' 
    ? queue 
    : queue.filter(item => item.status === filter);

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case QueueStatus.PROCESS:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case QueueStatus.PENDING:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case QueueStatus.FINISHED:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING:
        return <Clock className="w-4 h-4" />;
      case QueueStatus.PROCESS:
        return <Wrench className="w-4 h-4" />;
      case QueueStatus.PENDING:
        return <AlertCircle className="w-4 h-4" />;
      case QueueStatus.FINISHED:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const statusCounts = {
    ALL: queue.length,
    WAITING: queue.filter(q => q.status === QueueStatus.WAITING).length,
    PROCESS: queue.filter(q => q.status === QueueStatus.PROCESS).length,
    PENDING: queue.filter(q => q.status === QueueStatus.PENDING).length,
    FINISHED: queue.filter(q => q.status === QueueStatus.FINISHED).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Service Queue</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all service requests</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200">
          <div className="text-3xl font-bold text-slate-900">{queue.length}</div>
          <div className="text-xs text-slate-500 uppercase font-bold">Total in Queue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit">
        {[
          { id: 'ALL', label: 'All', count: statusCounts.ALL },
          { id: QueueStatus.WAITING, label: 'Waiting', count: statusCounts.WAITING },
          { id: QueueStatus.PROCESS, label: 'In Progress', count: statusCounts.PROCESS },
          { id: QueueStatus.PENDING, label: 'Pending Parts', count: statusCounts.PENDING },
          { id: QueueStatus.FINISHED, label: 'Finished', count: statusCounts.FINISHED },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2.5 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              filter === tab.id 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Queue Items */}
      {filteredQueue.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No items in queue</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter === 'ALL' ? 'The queue is empty' : `No items with status: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQueue.map(item => (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left Section - Ticket & Vehicle Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm">
                      {item.ticketNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Vehicle</p>
                      <p className="text-xl font-bold text-slate-900 font-mono">{item.licensePlate}</p>
                      <p className="text-slate-600">{item.vehicleModel}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
                      <p className="text-slate-900 font-semibold">{item.customerName}</p>
                      <p className="text-slate-500 text-sm">{item.customerPhone}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Customer Issue</p>
                    <p className="text-slate-700">{item.complaint}</p>
                    {item.diagnosis && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Diagnosis</p>
                        <p className="text-slate-700">{item.diagnosis}</p>
                      </div>
                    )}
                    {item.aiDiagnosis && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-purple-400 uppercase mb-1">AI Analysis</p>
                        <p className="text-slate-700">{item.aiDiagnosis}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {item.status === QueueStatus.WAITING && (
                    <div className="space-y-2">
                      {showMechanicSelect === item.id ? (
                        <>
                          <select
                            value={selectedMechanic[item.id] || ''}
                            onChange={(e) => setSelectedMechanic(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                          >
                            <option value="">-- Pilih Mekanik --</option>
                            {mechanics.map(m => {
                              const activeJob = getMechanicActiveJob(m.id);
                              return (
                                <option 
                                  key={m.id} 
                                  value={m.id}
                                  disabled={!!activeJob}
                                >
                                  {m.name} {activeJob ? `(Sibuk: ${activeJob.licensePlate})` : ''}
                                </option>
                              );
                            })}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartJob(item.id)}
                              disabled={!selectedMechanic[item.id]}
                              className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
                            >
                              <Wrench className="w-4 h-4" />
                              Mulai
                            </button>
                            <button
                              onClick={() => setShowMechanicSelect(null)}
                              className="px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50"
                            >
                              Batal
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowMechanicSelect(item.id)}
                          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Assign Mekanik
                        </button>
                      )}
                    </div>
                  )}
                  
                  {item.status === QueueStatus.PROCESS && (
                    <>
                      {/* Show assigned mechanic */}
                      {item.mechanicId && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 mb-1">
                          <User className="w-3 h-3" />
                          {users.find(u => u.id === item.mechanicId)?.name || 'Mekanik'}
                        </div>
                      )}
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.PENDING)}
                        className="border border-amber-200 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Pending Parts
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, QueueStatus.FINISHED)}
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    </>
                  )}

                  {item.status === QueueStatus.PENDING && (
                    <button
                      onClick={() => updateStatus(item.id, QueueStatus.PROCESS)}
                      className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      Resume Work
                    </button>
                  )}

                  {item.status === QueueStatus.FINISHED && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Queue;