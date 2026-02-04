import React, { useState, useEffect, useCallback } from 'react';
import { QRISUploader } from '../components/QRISUploader';
import qrisService, { QRISData } from '../../services/qrisService';
import mootaService, { MootaSettings as MootaSettingsData, MootaBankAccount } from '../../services/mootaService';
import { useBranch } from '../../lib/BranchContext';

type PaymentTab = 'qris' | 'moota';

export const PaymentSettings: React.FC = () => {
  const { activeBranch } = useBranch();
  const [activeTab, setActiveTab] = useState<PaymentTab>('qris');
  
  // QRIS State
  const [qrisData, setQrisData] = useState<QRISData[]>([]);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [qrisSuccess, setQrisSuccess] = useState<string | null>(null);
  const [defaultAmount, setDefaultAmount] = useState<number>(50000);
  
  // Moota State
  const [mootaSettings, setMootaSettings] = useState<MootaSettingsData[]>([]);
  const [mootaLoading, setMootaLoading] = useState(false);
  const [mootaError, setMootaError] = useState<string | null>(null);
  const [mootaSuccess, setMootaSuccess] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<MootaBankAccount[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Moota Form
  const [mootaForm, setMootaForm] = useState({
    accessToken: '',
    bankAccountId: '',
    bankAccountName: '',
    accountNumber: '',
    bankType: '',
    uniqueCodeStart: 1,
    uniqueCodeEnd: 999,
    isActive: true
  });
  const [isEditingMoota, setIsEditingMoota] = useState(false);
  const [editingMootaId, setEditingMootaId] = useState<string | null>(null);

  // Load QRIS Data
  const loadQRISData = useCallback(async () => {
    setQrisLoading(true);
    try {
      const data = await qrisService.getAllQRISData();
      setQrisData(data);
    } catch (error) {
      console.error('Failed to load QRIS data:', error);
      setQrisData([]);
    } finally {
      setQrisLoading(false);
    }
  }, []);

  // Load Moota Settings
  const loadMootaSettings = useCallback(async () => {
    setMootaLoading(true);
    try {
      const data = await mootaService.getAllSettings();
      setMootaSettings(data);
    } catch (err) {
      setMootaError('Gagal memuat pengaturan Moota');
    } finally {
      setMootaLoading(false);
    }
  }, []);

  // Load default amount from localStorage
  const loadDefaultAmount = useCallback(() => {
    const savedAmount = localStorage.getItem('qris_default_amount');
    if (savedAmount) {
      setDefaultAmount(parseInt(savedAmount, 10));
    }
  }, []);

  useEffect(() => {
    loadQRISData();
    loadMootaSettings();
    loadDefaultAmount();
    
    // Listen for branch change
    const handleBranchChange = () => {
      loadQRISData();
      loadMootaSettings();
      loadDefaultAmount();
      resetMootaForm();
    };
    
    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, [loadQRISData, loadMootaSettings, loadDefaultAmount]);

  // QRIS Handlers
  const handleQrDecode = async (data: string | null, error?: string) => {
    setQrisError(null);
    setQrisSuccess(null);

    if (error) {
      setQrisError(error);
      return;
    }

    if (!data) {
      setQrisError('Data QRIS tidak ditemukan');
      return;
    }

    setQrisLoading(true);

    try {
      if (!qrisService.validateQRIS(data)) {
        throw new Error('Format QRIS tidak valid');
      }

      const merchantName = qrisService.getMerchantName(data);
      const existingQris = qrisData.find(qris => qris.qrisString === data);
      if (existingQris) {
        throw new Error('QRIS ini sudah ditambahkan');
      }

      await qrisService.saveQRISData({
        merchantName,
        qrisString: data,
        isDefault: qrisData.length === 0
      });

      setQrisSuccess(`QRIS untuk ${merchantName} berhasil disimpan`);
      await loadQRISData();
    } catch (error) {
      setQrisError(error instanceof Error ? error.message : 'Gagal menyimpan QRIS');
    } finally {
      setQrisLoading(false);
    }
  };

  const handleSetDefaultQRIS = async (id: string) => {
    await qrisService.updateQRISData(id, { isDefault: true });
    await loadQRISData();
    setQrisSuccess('QRIS default berhasil diperbarui');
    setTimeout(() => setQrisSuccess(null), 3000);
  };

  const handleDeleteQRIS = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus QRIS ini?')) {
      await qrisService.deleteQRISData(id);
      await loadQRISData();
      setQrisSuccess('QRIS berhasil dihapus');
      setTimeout(() => setQrisSuccess(null), 3000);
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numValue)) {
      setDefaultAmount(0);
      localStorage.setItem('qris_default_amount', '0');
      return;
    }

    if (numValue > 10000000) {
      setQrisError('Maksimal Rp 10.000.000');
      return;
    }

    setDefaultAmount(numValue);
    localStorage.setItem('qris_default_amount', numValue.toString());
    setQrisSuccess('Nominal default berhasil diperbarui');
    setTimeout(() => setQrisSuccess(null), 3000);
  };

  // Moota Handlers
  const testMootaConnection = async () => {
    if (!mootaForm.accessToken) {
      setMootaError('Masukkan API Key terlebih dahulu');
      return;
    }

    setIsTestingConnection(true);
    setMootaError(null);
    setMootaSuccess(null);

    try {
      mootaService.setTempToken(mootaForm.accessToken);
      const result = await mootaService.testConnection();
      
      if (result.success && result.bankAccounts) {
        setBankAccounts(result.bankAccounts);
        setMootaSuccess(result.message);
      } else {
        setMootaError(result.message);
      }
    } catch (err) {
      setMootaError(err instanceof Error ? err.message : 'Koneksi gagal');
    } finally {
      mootaService.clearTempToken();
      setIsTestingConnection(false);
    }
  };

  const handleMootaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setMootaForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleBankSelect = (bankId: string) => {
    const bank = bankAccounts.find(b => b.bank_id === bankId);
    if (bank) {
      setMootaForm(prev => ({
        ...prev,
        bankAccountId: bank.bank_id,
        bankAccountName: bank.atas_nama,
        accountNumber: bank.account_number,
        bankType: bank.bank_type
      }));
    }
  };

  const handleMootaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMootaLoading(true);
    setMootaError(null);
    setMootaSuccess(null);

    try {
      if (editingMootaId) {
        await mootaService.updateSettings(editingMootaId, mootaForm);
        setMootaSuccess('Pengaturan berhasil diperbarui');
      } else {
        await mootaService.saveSettings({
          ...mootaForm,
          secretToken: generateSecretToken(),
          webhookUrl: ''
        });
        setMootaSuccess('Pengaturan berhasil disimpan');
      }

      resetMootaForm();
      await loadMootaSettings();
    } catch (err) {
      setMootaError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setMootaLoading(false);
    }
  };

  const handleEditMoota = (setting: MootaSettingsData) => {
    setMootaForm({
      accessToken: setting.accessToken,
      bankAccountId: setting.bankAccountId,
      bankAccountName: setting.bankAccountName,
      accountNumber: setting.accountNumber,
      bankType: setting.bankType,
      uniqueCodeStart: setting.uniqueCodeStart,
      uniqueCodeEnd: setting.uniqueCodeEnd,
      isActive: setting.isActive
    });
    setEditingMootaId(setting.id || null);
    setIsEditingMoota(true);
  };

  const handleDeleteMoota = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengaturan ini?')) return;

    setMootaLoading(true);
    try {
      await mootaService.deleteSettings(id);
      setMootaSuccess('Pengaturan berhasil dihapus');
      await loadMootaSettings();
    } catch (err) {
      setMootaError('Gagal menghapus pengaturan');
    } finally {
      setMootaLoading(false);
    }
  };

  const handleSetActiveMoota = async (id: string) => {
    setMootaLoading(true);
    try {
      await mootaService.updateSettings(id, { isActive: true });
      setMootaSuccess('Rekening aktif berhasil diperbarui');
      await loadMootaSettings();
    } catch (err) {
      setMootaError('Gagal memperbarui');
    } finally {
      setMootaLoading(false);
    }
  };

  const resetMootaForm = () => {
    setMootaForm({
      accessToken: '',
      bankAccountId: '',
      bankAccountName: '',
      accountNumber: '',
      bankType: '',
      uniqueCodeStart: 1,
      uniqueCodeEnd: 999,
      isActive: true
    });
    setEditingMootaId(null);
    setIsEditingMoota(false);
    setBankAccounts([]);
  };

  const generateSecretToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Pembayaran</h1>
        <p className="text-gray-600 mt-1">
          Konfigurasi metode pembayaran untuk booking pelanggan
        </p>
        {activeBranch && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <span className="material-symbols-outlined text-sm mr-1">store</span>
            {activeBranch.name}
          </div>
        )}
      </div>

      {/* Payment Method Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('qris')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'qris'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QRIS (Upload Bukti)
            </button>
            <button
              onClick={() => setActiveTab('moota')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'moota'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Moota Transfer (Otomatis)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* QRIS Tab */}
          {activeTab === 'qris' && (
            <div className="space-y-6">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Metode QRIS dengan Upload Bukti</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Pelanggan akan melihat QRIS statis Anda dan harus upload bukti pembayaran. 
                      Verifikasi dilakukan manual oleh kasir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Messages */}
              {qrisError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {qrisError}
                  </p>
                </div>
              )}
              
              {qrisSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {qrisSuccess}
                  </p>
                </div>
              )}

              {/* Upload Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload QRIS Baru</h3>
                <QRISUploader onQrDecode={handleQrDecode} />
              </div>

              {/* Default Amount */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nominal Biaya Booking</h3>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biaya Booking Default
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={defaultAmount.toLocaleString('id-ID')}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="50.000"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Saat ini: <span className="font-medium text-gray-900">{formatCurrency(defaultAmount)}</span>
                  </p>
                </div>
              </div>

              {/* Saved QRIS List */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  QRIS Tersimpan ({qrisData.length})
                </h3>

                {qrisData.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-gray-500">Belum ada QRIS tersimpan</p>
                    <p className="text-gray-400 text-sm">Upload QRIS pertama Anda di atas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {qrisData.map((qris) => (
                      <div
                        key={qris.id}
                        className={`border rounded-lg p-4 ${
                          qris.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{qris.merchantName}</h4>
                              {qris.isDefault && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Ditambahkan: {formatDate(qris.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex space-x-2">
                            {!qris.isDefault && (
                              <button
                                onClick={() => handleSetDefaultQRIS(qris.id!)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteQRIS(qris.id!)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moota Tab */}
          {activeTab === 'moota' && (
            <div className="space-y-6">
              {/* Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Metode Moota Transfer Otomatis</p>
                    <p className="text-sm text-green-600 mt-1">
                      Pelanggan transfer ke rekening bank Anda dengan kode unik. 
                      Verifikasi <strong>otomatis</strong> melalui Moota.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Messages */}
              {mootaError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {mootaError}
                  </p>
                </div>
              )}
              
              {mootaSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {mootaSuccess}
                  </p>
                </div>
              )}

              {/* Moota Form */}
              <form onSubmit={handleMootaSubmit} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isEditingMoota ? 'Edit Konfigurasi' : 'Tambah Rekening Baru'}
                  </h3>
                  {isEditingMoota && (
                    <button
                      type="button"
                      onClick={resetMootaForm}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moota API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      name="accessToken"
                      value={mootaForm.accessToken}
                      onChange={handleMootaInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Masukkan API Key dari Moota"
                      required
                    />
                    <button
                      type="button"
                      onClick={testMootaConnection}
                      disabled={isTestingConnection || !mootaForm.accessToken}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {isTestingConnection ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Test...
                        </>
                      ) : (
                        'Test Koneksi'
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Dapatkan API Key dari <a href="https://app.moota.co/developer/api" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">dashboard Moota</a>
                  </p>
                </div>

                {/* Bank Selection */}
                {bankAccounts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Rekening Bank <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bankAccounts.map((bank) => (
                        <div
                          key={bank.bank_id}
                          onClick={() => handleBankSelect(bank.bank_id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            mootaForm.bankAccountId === bank.bank_id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              mootaForm.bankAccountId === bank.bank_id ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">{bank.bank_type}</p>
                              <p className="text-sm text-gray-600">{bank.account_number}</p>
                              <p className="text-xs text-gray-500">{bank.atas_nama}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unique Code Range */}
                {mootaForm.bankAccountId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Range Kode Unik
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="uniqueCodeStart"
                        value={mootaForm.uniqueCodeStart}
                        onChange={handleMootaInputChange}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="999"
                      />
                      <span className="text-gray-500">sampai</span>
                      <input
                        type="number"
                        name="uniqueCodeEnd"
                        value={mootaForm.uniqueCodeEnd}
                        onChange={handleMootaInputChange}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="999"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Kode unik 3 digit akan ditambahkan ke nominal transfer (contoh: Rp 50.000 + 123 = Rp 50.123)
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                {mootaForm.bankAccountId && (
                  <button
                    type="submit"
                    disabled={mootaLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {mootaLoading ? 'Menyimpan...' : isEditingMoota ? 'Perbarui Konfigurasi' : 'Simpan Konfigurasi'}
                  </button>
                )}
              </form>

              {/* Saved Moota Settings */}
              {mootaSettings.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rekening Tersimpan ({mootaSettings.length})
                  </h3>
                  <div className="space-y-3">
                    {mootaSettings.map((setting) => (
                      <div
                        key={setting.id}
                        className={`border rounded-lg p-4 ${
                          setting.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {mootaService.getBankTypeName(setting.bankType)}
                              </span>
                              {setting.isActive && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{setting.accountNumber}</p>
                            <p className="text-xs text-gray-500">{setting.bankAccountName}</p>
                          </div>
                          
                          <div className="flex space-x-2">
                            {!setting.isActive && (
                              <button
                                onClick={() => handleSetActiveMoota(setting.id!)}
                                className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded hover:bg-green-200"
                              >
                                Set Aktif
                              </button>
                            )}
                            <button
                              onClick={() => handleEditMoota(setting)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMoota(setting.id!)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">📖 Cara Kerja di Halaman Booking</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">QRIS (Upload Bukti)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Pelanggan melihat QR code QRIS</li>
              <li>2. Pelanggan transfer via mobile banking</li>
              <li>3. Pelanggan upload bukti pembayaran</li>
              <li>4. Kasir verifikasi manual</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-700 mb-2">Moota Transfer (Otomatis)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Pelanggan melihat nomor rekening + kode unik</li>
              <li>2. Pelanggan transfer nominal exact (contoh: Rp 50.123)</li>
              <li>3. Moota deteksi mutasi masuk</li>
              <li>4. Sistem <strong>otomatis</strong> verifikasi pembayaran</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
