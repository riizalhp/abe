// Halaman Tambah Cabang - Form untuk menambah cabang baru
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../lib/BranchContext';
import { Building2, MapPin, Phone, Hash, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function AddBranchPage() {
  const navigate = useNavigate();
  const { addBranch, refreshBranches } = useBranch();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto-generate code from name
  const generateCode = () => {
    if (formData.name && !formData.code) {
      const code = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 5);
      setFormData(prev => ({ ...prev, code: code + '-' + Math.random().toString(36).substring(2, 4).toUpperCase() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Nama cabang wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const result = await addBranch({
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        isMain: false,
        isActive: true,
      });

      if (!result.success) {
        throw new Error(result.error || 'Gagal menambah cabang');
      }

      setSuccess(true);
      await refreshBranches();

      // Show success for a moment then redirect
      setTimeout(() => {
        navigate('/workshop-settings');
      }, 2000);

    } catch (err: any) {
      console.error('Add branch error:', err);
      setError(err.message || 'Gagal menambah cabang');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Cabang Berhasil Ditambahkan!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Cabang <strong>{formData.name}</strong> telah ditambahkan ke workshop Anda.
          </p>
          <p className="text-sm text-slate-500">
            Mengalihkan ke halaman pengaturan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tambah Cabang Baru</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Tambahkan cabang baru untuk workshop Anda
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Cabang */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nama Cabang *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateCode}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                placeholder="Contoh: Cabang Bandung, Cabang Surabaya"
                required
              />
            </div>
          </div>

          {/* Kode Cabang */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kode Cabang
              <span className="text-slate-400 font-normal ml-1">(opsional, auto-generate)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white font-mono uppercase"
                placeholder="BDG-01"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kode unik untuk identifikasi cabang. Akan di-generate otomatis jika dikosongkan.
            </p>
          </div>

          {/* No. Telepon */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              No. Telepon Cabang
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                placeholder="08123456789"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Alamat Cabang
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white resize-none"
                placeholder="Alamat lengkap cabang"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2">
              💡 Informasi
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Cabang baru akan otomatis aktif setelah ditambahkan</li>
              <li>• Data operasional (tiket, booking, dll) akan terisolasi per cabang</li>
              <li>• Anda bisa berpindah antar cabang melalui selector di header</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5 mr-2" />
                  Tambah Cabang
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
