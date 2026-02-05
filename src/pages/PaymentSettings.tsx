import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRISUploader } from '../components/QRISUploader';
import qrisService, { QRISData } from '../../services/qrisService';
import workshopService from '../../services/workshopService';
import { useBranch } from '../../lib/BranchContext';

type ActivePaymentMethod = 'qris' | 'moota';

export const PaymentSettings: React.FC = () => {
  const { activeBranch } = useBranch();

  // Active Payment Method Toggle
  const [activePaymentMethod, setActivePaymentMethod] = useState<ActivePaymentMethod>('qris');
  const [showMethodChangeAlert, setShowMethodChangeAlert] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<ActivePaymentMethod | null>(null);

  // QRIS State
  const [qrisData, setQrisData] = useState<QRISData[]>([]);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [qrisSuccess, setQrisSuccess] = useState<string | null>(null);
  const [defaultAmount, setDefaultAmount] = useState<number>(50000);

  // Debounce timer for booking fee
  const bookingFeeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSavingBookingFee, setIsSavingBookingFee] = useState(false);

  // Load Active Payment Method
  const loadActivePaymentMethod = useCallback(() => {
    const saved = localStorage.getItem('active_payment_method');
    if (saved === 'qris' || saved === 'moota') {
      setActivePaymentMethod(saved);
    }
  }, []);



  // Load QRIS Data
  const loadQRISData = useCallback(async () => {
    setQrisLoading(true);
    try {
      // Pass activeBranch.id if available
      const data = await qrisService.getAllQRISData(activeBranch?.id);
      setQrisData(data);
    } catch (error) {
      console.error('Failed to load QRIS data:', error);
      setQrisData([]);
    } finally {
      setQrisLoading(false);
    }
  }, [activeBranch]);

  // Load default amount from Supabase workshop settings
  const loadDefaultAmount = useCallback(async () => {
    try {
      // Try getting ID from service first
      let workshopId = workshopService.getCurrentWorkshopId();

      // Fallback 1: Use active branch's workshop ID ( Most reliable if branch is selected)
      if (!workshopId && activeBranch?.workshopId) {
        console.log('[PaymentSettings] Retrieved workshop ID from activeBranch:', activeBranch.workshopId);
        workshopId = activeBranch.workshopId;
        workshopService.setCurrentWorkshop(workshopId);
      }

      // Fallback 2: LocalStorage
      if (!workshopId) {
        const storedId = localStorage.getItem('currentWorkshopId');
        if (storedId) {
          console.log('[PaymentSettings] Retrieved workshop ID from localStorage fallback:', storedId);
          workshopId = storedId;
          workshopService.setCurrentWorkshop(storedId);
        }
      }

      console.log('[PaymentSettings] Loading booking fee for workshop:', workshopId, 'branch:', activeBranch?.id);

      if (workshopId) {
        // Pass activeBranch.id to get specific fee if exists
        const bookingFee = await workshopService.getBookingFee(workshopId, activeBranch?.id);
        console.log('[PaymentSettings] Fetched booking fee from service:', bookingFee);

        // Validation: bookingFee must be a number
        if (typeof bookingFee !== 'number' || isNaN(bookingFee)) {
          console.warn('[PaymentSettings] Invalid booking fee received, defaulting to 25000');
          setDefaultAmount(25000);
          return;
        }

        // Check if we need to migrate from localStorage (Only for global/legacy)
        if (!activeBranch) {
          const localStorageFee = localStorage.getItem('booking_fee');
          if (localStorageFee) {
            const localFee = parseInt(localStorageFee, 10);
            console.log('[PaymentSettings] Found local storage fee:', localFee);

            if (!isNaN(localFee) && localFee !== bookingFee && localFee > 0) {
              console.log('[PaymentSettings] Migrating booking_fee from localStorage to Supabase:', localFee);
              const migrationResult = await workshopService.updateBookingFee(workshopId, localFee);

              if (migrationResult.success) {
                console.log('[PaymentSettings] Migration successful');
                setDefaultAmount(localFee);
                localStorage.removeItem('booking_fee');
              } else {
                console.error('[PaymentSettings] Migration failed:', migrationResult.error);
                setDefaultAmount(bookingFee);
              }
              return;
            }
          }
        }

        setDefaultAmount(bookingFee);
      } else {
        console.warn('[PaymentSettings] No workshop ID found - context might not be ready');
        setTimeout(async () => {
          const retryId = workshopService.getCurrentWorkshopId();
          if (retryId) {
            console.log('[PaymentSettings] Retry found workshop ID:', retryId);
            const fee = await workshopService.getBookingFee(retryId, activeBranch?.id);
            setDefaultAmount(fee);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('[PaymentSettings] Error loading booking fee:', error);
      setDefaultAmount(25000);
    }
  }, [activeBranch]);

  useEffect(() => {
    loadActivePaymentMethod();
    loadQRISData();
    loadDefaultAmount();

    const handleBranchChange = () => {
      loadActivePaymentMethod();
      loadQRISData();
      loadDefaultAmount();
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, [loadActivePaymentMethod, loadQRISData, loadDefaultAmount]);

  // Handle Payment Method Toggle
  const handlePaymentMethodChange = (method: ActivePaymentMethod) => {
    if (method === activePaymentMethod) return;
    setPendingMethod(method);
    setShowMethodChangeAlert(true);
  };

  const confirmMethodChange = () => {
    if (pendingMethod) {
      setActivePaymentMethod(pendingMethod);
      localStorage.setItem('active_payment_method', pendingMethod);
      setShowMethodChangeAlert(false);
      setPendingMethod(null);
      setQrisSuccess(`Metode pembayaran diubah ke ${pendingMethod === 'qris' ? 'QRIS' : 'Moota Transfer'}`);
      setTimeout(() => setQrisSuccess(null), 3000);
    }
  };

  const cancelMethodChange = () => {
    setShowMethodChangeAlert(false);
    setPendingMethod(null);
  };

  // QRIS Handlers
  // QRIS Handlers
  const [scannedQR, setScannedQR] = useState<{ raw: string; merchant: string } | null>(null);

  const handleQrDecode = async (data: string | null, error?: string) => {
    setQrisError(null);
    setQrisSuccess(null);

    if (error) {
      // setQrisError(error); // Optional: don't show scan errors immediately as it scans continuously
      return;
    }

    if (!data) return;

    // Avoid repetitive setting if same data
    if (scannedQR?.raw === data) return;

    try {
      if (!qrisService.validateQRIS(data)) {
        throw new Error('Format QRIS tidak valid');
      }

      const merchantName = qrisService.getMerchantName(data);
      setScannedQR({ raw: data, merchant: merchantName });
      setQrisSuccess(`QRIS terbaca valid! Merchant: ${merchantName}. Silakan klik Simpan.`);
    } catch (error) {
      setQrisError('QR Code tidak valid sebagai QRIS Indonesia Standard.');
    }
  };

  const handleManualSaveQRIS = async () => {
    if (!scannedQR) return;

    setQrisLoading(true);
    setQrisError(null);

    try {
      const existingQris = qrisData.find(qris => qris.qrisString === scannedQR.raw);
      if (existingQris) {
        throw new Error('QRIS ini sudah ada di daftar tersimpan');
      }

      await qrisService.saveQRISData({
        merchantName: scannedQR.merchant,
        qrisString: scannedQR.raw,
        isDefault: qrisData.length === 0,
        branchId: activeBranch?.id
      } as any);

      setQrisSuccess(`QRIS ${scannedQR.merchant} berhasil disimpan!`);
      setScannedQR(null); // Clear preview
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
      return;
    }

    if (numValue > 10000000) {
      setQrisError('Maksimal Rp 10.000.000');
      return;
    }

    setDefaultAmount(numValue);
  };

  const handleSaveBookingFee = async () => {
    console.log('[PaymentSettings] Saving booking fee...', defaultAmount);
    setIsSavingBookingFee(true);

    let workshopId = workshopService.getCurrentWorkshopId();

    // Fallback: activeBranch
    if (!workshopId && activeBranch?.workshopId) {
      workshopId = activeBranch.workshopId;
    }

    // Fallback: localStorage
    if (!workshopId) {
      workshopId = localStorage.getItem('currentWorkshopId');
    }

    if (!workshopId) {
      console.error('[PaymentSettings] Cannot save: No workshop ID');
      setQrisError('Workshop ID tidak ditemukan - Silakan refresh halaman');
      setIsSavingBookingFee(false);
      return;
    }

    // Pass activeBranch.id
    const result = await workshopService.updateBookingFee(workshopId, defaultAmount, activeBranch?.id);
    console.log('[PaymentSettings] Save result:', result);

    if (result.success) {
      setQrisSuccess(`Nominal berhasil disimpan${activeBranch ? ` untuk ${activeBranch.name}` : ''}`);
      // Reload to confirm persistence
      await loadDefaultAmount();
      setTimeout(() => setQrisSuccess(null), 3000);
    } else {
      console.error('[PaymentSettings] Save failed:', result.error);
      setQrisError(`Gagal menyimpan nominal: ${result.error}`);
      setTimeout(() => setQrisError(null), 3000);
    }

    setIsSavingBookingFee(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (bookingFeeTimeoutRef.current) {
        clearTimeout(bookingFeeTimeoutRef.current);
      }
    };
  }, []);

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
      {/* Method Change Confirmation Alert */}
      {showMethodChangeAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ganti Metode Pembayaran?</h3>
                <p className="text-sm text-gray-600">
                  Anda akan mengganti metode pembayaran menjadi{' '}
                  <strong>{pendingMethod === 'qris' ? 'QRIS' : 'Moota Transfer'}</strong>
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Halaman booking pelanggan akan menggunakan metode pembayaran yang baru dipilih.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelMethodChange}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmMethodChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ya, Ganti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Pembayaran</h1>
          {activeBranch ? (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">store</span>
              {activeBranch.name}
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200 shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">domain</span>
              Global Settings
            </span>
          )}
        </div>
        <p className="text-slate-600 mt-1">Kelola metode pembayaran dan biaya booking{!activeBranch && ' (Mode Workshop Global)'}.</p>
      </div>

      {/* Active Payment Method Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Metode Pembayaran Aktif</h2>
            <p className="text-sm text-gray-600">Pilih metode yang akan digunakan di halaman booking</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${activePaymentMethod === 'qris'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
            }`}>
            {activePaymentMethod === 'qris' ? 'QRIS Aktif' : 'Moota Aktif'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* QRIS Option */}
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('qris')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${activePaymentMethod === 'qris'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activePaymentMethod === 'qris' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">QRIS</span>
                  {activePaymentMethod === 'qris' && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500">Upload bukti transfer</p>
              </div>
            </div>
          </button>

          {/* Moota Option */}
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('moota')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${activePaymentMethod === 'moota'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activePaymentMethod === 'moota' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Moota Transfer</span>
                  {activePaymentMethod === 'moota' && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500">Verifikasi otomatis</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Default Booking Fee - Applies to both QRIS and Moota */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Nominal Biaya Booking</h2>
            <p className="text-sm text-gray-600">
              Nominal ini digunakan untuk <strong>QRIS</strong> maupun <strong>Moota Transfer</strong>
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">Rp</span>
              </div>
              <input
                type="text"
                value={defaultAmount.toLocaleString('id-ID')}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                placeholder="50.000"
              />
            </div>
            <button
              onClick={handleSaveBookingFee}
              disabled={isSavingBookingFee}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isSavingBookingFee ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Simpan
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Biaya booking saat ini: <span className="font-semibold text-purple-600">{formatCurrency(defaultAmount)}</span>
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {qrisError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {qrisError}
          </p>
        </div>
      )}

      {qrisSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {qrisSuccess}
          </p>
        </div>
      )}

      {/* QRIS Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pengaturan QRIS</h2>
            <p className="text-sm text-gray-600">Upload dan kelola QR Code QRIS untuk pembayaran</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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

        {/* Upload Section */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Upload QRIS Baru</h3>
          <QRISUploader onQrDecode={handleQrDecode} />

          {/* Manual Save Preview Area */}
          {scannedQR && (
            <div className="mt-4 p-4 border rounded-lg bg-purple-50 border-purple-200 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-bold uppercase tracking-wide">QRIS Terdeteksi</p>
                  <h4 className="text-lg font-bold text-gray-900 mt-1">{scannedQR.merchant}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-1 break-all line-clamp-1">{scannedQR.raw}</p>
                </div>
                <button
                  onClick={handleManualSaveQRIS}
                  disabled={qrisLoading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  {qrisLoading ? 'Menyimpan...' : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Simpan QRIS
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved QRIS List */}
        <div className="border-t pt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
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
                  className={`border rounded-lg p-4 ${qris.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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

      {/* Moota Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Status Moota</h2>
            <p className="text-sm text-gray-600">Integrasi pembayaran transfer otomatis</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">Moota Sudah Dikonfigurasi</p>
              <p className="text-sm text-green-600 mt-1">
                Pembayaran via transfer bank dengan verifikasi otomatis sudah aktif.
                Pelanggan akan menerima kode unik untuk setiap transaksi.
              </p>
            </div>
          </div>
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
