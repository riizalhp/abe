import React, { useState, useEffect, useCallback } from 'react';
import workshopService, { 
  getWorkshopById, 
  getWorkshopStaff, 
  createStaffInvitation, 
  getWorkshopInvitations,
  removeStaffFromWorkshop,
  updateWorkshop
} from '../../services/workshopService';
import { Workshop, User, Role } from '../../types';
import { useBranch } from '../../lib/BranchContext';

interface WorkshopSettingsProps {
  currentUser: User;
}

const WorkshopSettings: React.FC<WorkshopSettingsProps> = ({ currentUser }) => {
  const { activeBranch } = useBranch();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'invitations'>('general');
  
  // Form states
  const [workshopName, setWorkshopName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [workshopPhone, setWorkshopPhone] = useState('');
  const [workshopEmail, setWorkshopEmail] = useState('');
  const [workshopDescription, setWorkshopDescription] = useState('');
  
  // Invitation form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.MEKANIK);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkshopData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentUser.workshopId) {
        const branchId = activeBranch?.id;
        const [ws, staffList, invites] = await Promise.all([
          getWorkshopById(currentUser.workshopId),
          getWorkshopStaff(currentUser.workshopId, branchId),
          getWorkshopInvitations(currentUser.workshopId, branchId)
        ]);
        
        if (ws) {
          setWorkshop(ws);
          setWorkshopName(ws.name);
          setWorkshopAddress(ws.address || '');
          setWorkshopPhone(ws.phone || '');
          setWorkshopEmail(ws.email || '');
          setWorkshopDescription(ws.description || '');
        }
        
        setStaff(staffList);
        setInvitations(invites);
      }
    } catch (error) {
      console.error('Error loading workshop data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data workshop' });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.workshopId, activeBranch?.id]);

  useEffect(() => {
    loadWorkshopData();
    
    // Listen for branch change
    const handleBranchChange = () => {
      loadWorkshopData();
    };
    
    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, [loadWorkshopData]);

  const handleSaveWorkshop = async () => {
    if (!workshop) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await updateWorkshop(workshop.id, {
        name: workshopName,
        address: workshopAddress,
        phone: workshopPhone,
        email: workshopEmail,
        description: workshopDescription
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Workshop berhasil diperbarui!' });
        loadWorkshopData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal memperbarui workshop' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteStaff = async () => {
    if (!workshop || !inviteEmail) return;
    
    setIsInviting(true);
    setMessage(null);
    setInviteCode(null);
    
    try {
      const result = await createStaffInvitation(
        workshop.id,
        inviteEmail,
        inviteRole,
        currentUser.id,
        activeBranch?.id // Pass branch ID
      );
      
      if (result.inviteCode) {
        setInviteCode(result.inviteCode);
        setInviteEmail('');
        setMessage({ type: 'success', text: `Undangan berhasil dibuat untuk cabang ${activeBranch?.name || 'utama'}!` });
        loadWorkshopData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal membuat undangan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveStaff = async (userId: string, userName: string) => {
    if (!workshop) return;
    if (!confirm(`Hapus ${userName} dari workshop?`)) return;
    
    try {
      const result = await removeStaffFromWorkshop(workshop.id, userId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Staff berhasil dihapus' });
        loadWorkshopData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal menghapus staff' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    }
  };

  const copyInviteLink = () => {
    if (!workshop || !inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setMessage({ type: 'success', text: 'Link undangan disalin!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pengaturan workshop...</p>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-yellow-500">warning</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workshop Tidak Ditemukan</h2>
        <p className="text-gray-600">Anda belum terdaftar di workshop manapun.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Workshop</h1>
          {activeBranch && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {activeBranch.name}
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Kelola informasi dan staff workshop Anda
          {activeBranch && <span className="text-blue-600"> (Cabang: {activeBranch.name})</span>}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {message.text}
        </div>
      )}

      {/* Booking Link Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white mb-8">
        <h3 className="text-lg font-semibold mb-2">Link Booking Pelanggan {activeBranch && `- ${activeBranch.name}`}</h3>
        <p className="text-white/80 text-sm mb-4">Bagikan link ini kepada pelanggan untuk booking online di cabang ini</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
            {activeBranch 
              ? `${window.location.origin}/booking/${workshop.slug}/${activeBranch.code}`
              : `${window.location.origin}/booking/${workshop.slug}`
            }
          </div>
          <button
            onClick={() => {
              const url = activeBranch 
                ? `${window.location.origin}/booking/${workshop.slug}/${activeBranch.code}`
                : `${window.location.origin}/booking/${workshop.slug}`;
              navigator.clipboard.writeText(url);
              setMessage({ type: 'success', text: 'Link disalin!' });
            }}
            className="px-4 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            <span className="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'general', label: 'Informasi Umum', icon: 'storefront' },
          { key: 'staff', label: 'Staff', icon: 'group' },
          { key: 'invitations', label: 'Undangan', icon: 'mail' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Workshop</label>
              <input
                type="text"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nama bengkel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug URL</label>
              <input
                type="text"
                value={workshop.slug}
                disabled
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">URL: /booking/{workshop.slug}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
              <input
                type="tel"
                value={workshopPhone}
                onChange={(e) => setWorkshopPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={workshopEmail}
                onChange={(e) => setWorkshopEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="email@bengkel.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
              <input
                type="text"
                value={workshopAddress}
                onChange={(e) => setWorkshopAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Alamat lengkap bengkel"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
              <textarea
                value={workshopDescription}
                onChange={(e) => setWorkshopDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Deskripsi singkat tentang bengkel"
              />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSaveWorkshop}
              disabled={isSaving}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Daftar Staff ({staff.length})</h3>
          </div>
          
          {staff.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
              <p>Belum ada staff terdaftar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {staff.map(member => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.name}
                        {member.isOwner && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Owner</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.role} • {member.email || member.username}</p>
                    </div>
                  </div>
                  
                  {!member.isOwner && currentUser.isOwner && (
                    <button
                      onClick={() => handleRemoveStaff(member.id, member.name)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Hapus dari workshop"
                    >
                      <span className="material-symbols-outlined">person_remove</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Invite Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Undang Staff Baru</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="email@staff.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.MEKANIK}>Mekanik</option>
                  <option value={Role.KASIR}>Kasir</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleInviteStaff}
              disabled={isInviting || !inviteEmail}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isInviting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Kirim Undangan
                </>
              )}
            </button>
            
            {/* Invite Code Display */}
            {inviteCode && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2">Kode undangan berhasil dibuat:</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-white px-4 py-2 rounded border border-green-200 font-mono text-lg">
                    {inviteCode}
                  </code>
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Link: {window.location.origin}/join/{inviteCode}
                </p>
              </div>
            )}
          </div>
          
          {/* Pending Invitations */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Undangan Pending ({invitations.length})</h3>
            </div>
            
            {invitations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">mail</span>
                <p>Tidak ada undangan pending</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {invitations.map(invite => (
                  <div key={invite.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-500">
                        Role: {invite.role} • Kode: {invite.invite_code}
                      </p>
                      <p className="text-xs text-gray-400">
                        Kadaluarsa: {new Date(invite.expires_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join/${invite.invite_code}`);
                        setMessage({ type: 'success', text: 'Link disalin!' });
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopSettings;
