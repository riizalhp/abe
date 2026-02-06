import React, { useState, useEffect, useCallback } from 'react';
import workshopService, {
  getWorkshopById,
  getWorkshopStaff,
  removeStaffFromWorkshop,
  updateWorkshop,
  getWorkshopBySlug
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'staff'>('general');

  // Form states
  const [workshopName, setWorkshopName] = useState('');
  const [workshopSlug, setWorkshopSlug] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [workshopPhone, setWorkshopPhone] = useState('');
  const [workshopEmail, setWorkshopEmail] = useState('');
  const [workshopDescription, setWorkshopDescription] = useState('');

  // Slug validation
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkshopData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentUser.workshopId) {
        const branchId = activeBranch?.id;
        const [ws, staffList] = await Promise.all([
          getWorkshopById(currentUser.workshopId),
          getWorkshopStaff(currentUser.workshopId, branchId)
        ]);

        if (ws) {
          setWorkshop(ws);
          setWorkshopName(ws.name);
          setWorkshopSlug(ws.slug);
          setWorkshopAddress(ws.address || '');
          setWorkshopPhone(ws.phone || '');
          setWorkshopEmail(ws.email || '');
          setWorkshopDescription(ws.description || '');
          setSlugAvailable(null);
          setSlugError(null);
        }

        setStaff(staffList);
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

  // Validate slug format
  const formatSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Check if slug is available
  const checkSlugAvailability = async (slug: string) => {
    if (!workshop || slug === workshop.slug) {
      setSlugAvailable(null);
      setSlugError(null);
      return;
    }

    if (slug.length < 3) {
      setSlugError('Slug minimal 3 karakter');
      setSlugAvailable(false);
      return;
    }

    setIsCheckingSlug(true);
    setSlugError(null);

    try {
      const existingWorkshop = await getWorkshopBySlug(slug);
      if (existingWorkshop && existingWorkshop.id !== workshop.id) {
        setSlugError('Slug sudah digunakan oleh bengkel lain');
        setSlugAvailable(false);
      } else {
        setSlugAvailable(true);
        setSlugError(null);
      }
    } catch (error) {
      setSlugError('Gagal memeriksa ketersediaan slug');
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Debounced slug check
  useEffect(() => {
    if (!workshop) return;
    if (workshopSlug === workshop.slug) {
      setSlugAvailable(null);
      setSlugError(null);
      return;
    }

    const timer = setTimeout(() => {
      checkSlugAvailability(workshopSlug);
    }, 500);

    return () => clearTimeout(timer);
  }, [workshopSlug, workshop?.slug]);

  const handleSlugChange = (value: string) => {
    const formattedSlug = formatSlug(value);
    setWorkshopSlug(formattedSlug);
  };

  const handleSaveWorkshop = async () => {
    if (!workshop) return;

    // Validate slug before saving
    if (workshopSlug !== workshop.slug && slugAvailable === false) {
      setMessage({ type: 'error', text: slugError || 'Slug tidak tersedia' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateWorkshop(workshop.id, {
        name: workshopName,
        slug: workshopSlug !== workshop.slug ? workshopSlug : undefined,
        address: workshopAddress,
        phone: workshopPhone,
        description: workshopDescription
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Workshop berhasil diperbarui!' });

        setWorkshop(prev => prev ? ({
          ...prev,
          name: workshopName,
          address: workshopAddress,
          phone: workshopPhone,
          description: workshopDescription,
          slug: workshopSlug !== prev.slug ? workshopSlug : prev.slug
        }) : null);

        loadWorkshopData();
      } else {
        console.error("Save Error:", result.error);
        if (result.error && result.error.includes('Unauthorized')) {
          setMessage({ type: 'error', text: 'Gagal: Masalah izin akses. Coba logout dan login kembali.' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Gagal memperbarui workshop' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setIsSaving(false);
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
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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
          { key: 'staff', label: 'Staff', icon: 'group' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === tab.key
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug URL
                <span className="ml-2 text-xs font-normal text-gray-400">(tidak dapat diubah)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={workshopSlug}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="slug-bengkel-anda"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">URL: /booking/{workshopSlug || workshop.slug}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span className="ml-2 text-xs font-normal text-gray-400">(tidak dapat diubah)</span>
              </label>
              <input
                type="email"
                value={workshopEmail}
                disabled
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="email@bengkel.com"
              />
              <p className="text-xs text-gray-500 mt-1">Email terkait dengan akun login dan tidak dapat diubah</p>
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


    </div>
  );
};

export default WorkshopSettings;
