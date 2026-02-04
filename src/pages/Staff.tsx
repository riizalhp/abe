import React, { useState } from 'react';
import { UserPlus, Trash2, Star, X, Wrench } from 'lucide-react';
import { User, Role } from '../../types';

interface StaffProps {
    users: User[];
    onAddUser: (user: Partial<User>) => void;
    onDeleteUser: (id: string) => void;
}

const Staff: React.FC<StaffProps> = ({ users, onAddUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        role: Role.MEKANIK,
        specialization: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUser({
            ...newUser,
            avatar: `https://picsum.photos/seed/${newUser.name}-${Date.now()}/200/200`
        });
        setNewUser({ name: '', role: Role.MEKANIK, specialization: '' });
        setIsModalOpen(false);
    };

    const getRoleColor = (role: Role) => {
        switch (role) {
            case Role.OWNER: return 'bg-purple-100 text-purple-700 border-purple-200';
            case Role.ADMIN: return 'bg-blue-100 text-blue-700 border-blue-200';
            case Role.MEKANIK: return 'bg-slate-100 text-slate-700 border-slate-200';
            case Role.KASIR: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h2>
                    <p className="text-slate-500 text-sm">Manage accounts and role assignments</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center transition-all font-bold text-sm"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Tambah Mekanik
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Staff</p>
                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase">Mechanics</p>
                    <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === Role.MEKANIK).length}</p>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRoleColor(user.role)}`}>
                                {user.role}
                            </div>
                            {user.role !== Role.OWNER && (
                                <button onClick={() => onDeleteUser(user.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                                <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                                {user.specialization && (
                                    <p className="text-sm text-slate-500 flex items-center mt-1">
                                        <Wrench className="w-3 h-3 mr-1" /> {user.specialization}
                                    </p>
                                )}
                                {!user.specialization && <p className="text-sm text-slate-400 italic mt-1">General Staff</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                            <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <span className="text-xs font-bold text-slate-500 uppercase">{user.status || 'OFFLINE'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Tambah Mekanik Baru</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Form Fields kept minimal for brevity, same as original */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Mekanik</label>
                                <input type="text" required placeholder="Masukkan nama mekanik" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Spesialisasi (Opsional)</label>
                                <input type="text" placeholder="Contoh: Mesin, Kelistrikan, AC" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" value={newUser.specialization} onChange={e => setNewUser({ ...newUser, specialization: e.target.value })} />
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-700 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" />
                                    Staff akan ditambahkan sebagai <strong>Mekanik</strong>
                                </p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Tambah Mekanik</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
