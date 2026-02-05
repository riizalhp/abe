import React, { useState, useEffect, useCallback, useRef } from 'react';
import mootaService, { PaymentOrder, MootaSettings } from '../../services/mootaService';

interface MootaPaymentProps {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  description?: string;
  onPaymentComplete?: (order: PaymentOrder) => void;
  onPaymentVerified?: (order: PaymentOrder) => void; // Called when admin verifies payment
  onPaymentExpired?: () => void;
  onCancel?: () => void;
}

/**
 * MootaPayment Component - Supports Manual & Webhook Verification
 * 
 * === MANUAL MODE ===
 * Alur:
 * 1. Customer melihat nomor rekening + kode unik
 * 2. Customer transfer via mobile banking
 * 3. Customer klik "Saya Sudah Transfer" untuk konfirmasi
 * 4. Admin cek mutasi di dashboard Moota (moota.co)
 * 5. Admin klik "Verifikasi Transfer" di halaman admin
 * Cost: 0 Poin (no API polling)
 * 
 * === WEBHOOK MODE (Supabase Edge Function) ===
 * Alur:
 * 1. Customer melihat nomor rekening + kode unik
 * 2. Customer transfer via mobile banking
 * 3. Customer klik "Saya Sudah Transfer" untuk konfirmasi
 * 4. [AUTOMATIC] Moota detects mutation setiap 15 menit (0 Poin)
 * 5. [AUTOMATIC] POST ke Supabase Edge Function
 * 6. [AUTOMATIC] Payment auto-verified, status → PAID
 * 7. Customer polling detect PAID dalam 5 detik
 * 8. Customer auto-redirect ke step 3
 * Cost: 0 Poin (webhook robot)
 * 
 * Webhook Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback
 * Setup: See SUPABASE_WEBHOOK_SETUP.md
 * 
 * Component supports BOTH modes seamlessly:
 * - Manual verification via admin dashboard
 * - Webhook auto-verification via Supabase Edge Function
 * - Customer polling works for both
 */
export const MootaPayment: React.FC<MootaPaymentProps> = ({
  amount,
  orderId,
  customerName,
  customerPhone,
  description,
  onPaymentComplete,
  onPaymentVerified,
  onPaymentExpired,
  onCancel,
}) => {
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [settings, setSettings] = useState<MootaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState<'amount' | 'account' | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<string>('');
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize payment
  useEffect(() => {
    initializePayment();
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [orderId, amount]);

  // Countdown timer
  useEffect(() => {
    if (paymentOrder?.expiresAt && !hasConfirmed) {
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [paymentOrder?.expiresAt, hasConfirmed]);

  const updateCountdown = useCallback(() => {
    if (!paymentOrder?.expiresAt) return;

    const now = new Date();
    const expiry = new Date(paymentOrder.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      onPaymentExpired?.();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }, [paymentOrder?.expiresAt, onPaymentExpired]);

  const initializePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get active settings
      const mootaSettings = await mootaService.getActiveSettings();
      if (!mootaSettings) {
        throw new Error('Moota payment not configured. Please contact admin.');
      }
      setSettings(mootaSettings);

      // Check if order already exists
      let order = await mootaService.getPaymentOrder(orderId);
      
      if (!order) {
        // Create new payment order
        order = await mootaService.createPaymentOrder(
          orderId,
          customerName,
          customerPhone,
          amount,
          description
        );
      }

      setPaymentOrder(order);

      // Check if already confirmed by customer
      if (order.status === 'CHECKING' || order.status === 'PAID') {
        setHasConfirmed(true);
        if (order.status === 'PAID') {
          onPaymentComplete?.(order);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Customer confirms they have transferred
  const handleConfirmTransfer = async () => {
    if (!paymentOrder) return;

    console.log('[MootaPayment] handleConfirmTransfer called');
    console.log('[MootaPayment] Current paymentOrder:', paymentOrder);

    try {
      // Update order status to CHECKING (menunggu verifikasi admin)
      console.log('[MootaPayment] Updating order status to CHECKING...');
      const updateResult = await mootaService.updatePaymentOrderStatus(paymentOrder.orderId, 'CHECKING');
      console.log('[MootaPayment] Order status update result:', updateResult);
      
      // Verify the update by fetching the order again
      const verifyOrder = await mootaService.getPaymentOrder(paymentOrder.orderId);
      console.log('[MootaPayment] Verified order status:', verifyOrder?.status);
      
      setHasConfirmed(true);
      
      // Update local state with verified order
      const updatedOrder = verifyOrder || {
        ...paymentOrder,
        status: 'CHECKING' as const
      };
      setPaymentOrder(updatedOrder);
      
      // PENTING: Panggil onPaymentComplete untuk menyimpan booking
      // Ini akan membuat booking tersimpan di database dengan status PENDING
      console.log('[MootaPayment] Calling onPaymentComplete...');
      if (onPaymentComplete) {
        await onPaymentComplete(updatedOrder);
        console.log('[MootaPayment] onPaymentComplete finished');
      } else {
        console.warn('[MootaPayment] onPaymentComplete is not defined!');
      }
      
    } catch (err) {
      console.error('[MootaPayment] Failed to update order status:', err);
      // Still mark as confirmed locally even if update fails
      setHasConfirmed(true);
      // Tetap panggil onPaymentComplete agar booking tersimpan
      if (onPaymentComplete) {
        await onPaymentComplete(paymentOrder);
      }
    }
  };
  
  // Poll untuk cek jika admin sudah verifikasi atau webhook sudah update
  useEffect(() => {
    if (!hasConfirmed || !paymentOrder?.orderId) {
      console.log('[MootaPayment] Polling skipped - hasConfirmed:', hasConfirmed, 'orderId:', paymentOrder?.orderId);
      return;
    }
    
    console.log('[MootaPayment] Starting polling for payment verification. Order ID:', paymentOrder.orderId);
    setIsPolling(true);
    
    // Immediately check once
    const checkStatus = async () => {
      try {
        const now = new Date().toLocaleTimeString('id-ID');
        setLastPollTime(now);
        console.log('[MootaPayment] Checking payment status at', now, 'for:', paymentOrder.orderId);
        
        const updatedOrder = await mootaService.getPaymentOrder(paymentOrder.orderId);
        console.log('[MootaPayment] Payment order status:', updatedOrder?.status);
        
        if (updatedOrder?.status === 'PAID') {
          console.log('[MootaPayment] Payment verified! Calling onPaymentVerified...');
          console.log('[MootaPayment] onPaymentVerified callback exists?', !!onPaymentVerified);
          setPaymentOrder(updatedOrder);
          setIsPolling(false);
          
          // Tampilkan sukses
          alert('🎉 Pembayaran berhasil diverifikasi! Silakan lanjutkan mengisi keluhan.');
          
          // Panggil callback untuk lanjut ke step berikutnya (step 3 - input keluhan)
          if (onPaymentVerified) {
            console.log('[MootaPayment] Calling onPaymentVerified callback now...');
            onPaymentVerified(updatedOrder);
            console.log('[MootaPayment] onPaymentVerified callback completed');
          } else {
            console.warn('[MootaPayment] onPaymentVerified callback is not defined!');
          }
          return true; // Payment verified
        }
        
        return false; // Not yet verified
      } catch (err) {
        console.error('[MootaPayment] Poll error:', err);
        return false;
      }
    };
    
    // Check immediately on mount
    checkStatus();
    
    // Then poll every 5 seconds
    const pollInterval = setInterval(async () => {
      const verified = await checkStatus();
      if (verified) {
        clearInterval(pollInterval);
      }
    }, 5000);
    
    return () => {
      console.log('[MootaPayment] Stopping polling');
      setIsPolling(false);
      clearInterval(pollInterval);
    };
  }, [hasConfirmed, paymentOrder?.orderId]);

  const copyToClipboard = async (text: string, type: 'amount' | 'account') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Menyiapkan pembayaran...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memproses Pembayaran</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={initializePayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Customer has confirmed transfer - waiting for admin verification
  if (hasConfirmed) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-yellow-600 mb-2">Menunggu Verifikasi</h3>
          <p className="text-gray-600 mb-4">
            Terima kasih! Pembayaran Anda sedang diverifikasi oleh kasir.
            <br />Halaman ini akan otomatis berubah setelah diverifikasi.
          </p>
          
          {/* Polling Status Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              {isPolling ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700">
                    Mengecek status pembayaran... {lastPollTime && `(${lastPollTime})`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Menunggu...</span>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal Transfer:</span>
                <span className="font-bold text-gray-900">{formatCurrency(paymentOrder?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID Order:</span>
                <span className="font-mono text-gray-900">{paymentOrder?.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nama:</span>
                <span className="text-gray-900">{paymentOrder?.customerName}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Sudah transfer tapi lama diverifikasi?</p>
                <p className="mt-1">Hubungi bengkel untuk konfirmasi manual.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pembayaran Transfer Bank</h3>
          {onCancel && (
            <button onClick={onCancel} className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Timer */}
        <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <span className="text-sm">Sisa waktu:</span>
          <span className={`font-mono font-bold text-lg ${
            timeRemaining === 'Expired' ? 'text-red-300' : ''
          }`}>
            {timeRemaining === 'Expired' ? 'Kadaluarsa' : timeRemaining}
          </span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-6 space-y-4">
        {/* Bank Info */}
        {settings && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Transfer ke</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">
                  {mootaService.getBankTypeName(settings.bankType)}
                </div>
                <div className="text-gray-600">{settings.bankAccountName}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-gray-900">
                  {settings.accountNumber}
                </div>
                <button
                  onClick={() => copyToClipboard(settings.accountNumber, 'account')}
                  className="text-blue-600 text-sm hover:underline flex items-center justify-end gap-1"
                >
                  {copied === 'account' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Salin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
          <div className="text-sm text-blue-600 mb-1 font-medium">Jumlah Transfer (WAJIB SESUAI)</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {(() => {
                const numericPart = (paymentOrder?.totalAmount || 0).toString();
                const baseStr = 'Rp ';
                
                if (numericPart.length > 3) {
                  const mainPart = numericPart.slice(0, -3);
                  const highlightPart = numericPart.slice(-3);
                  const formattedMain = parseInt(mainPart).toLocaleString('id-ID');
                  return (
                    <>
                      <span className="text-blue-700">{baseStr}{formattedMain}.</span>
                      <span className="text-red-600 bg-red-50 px-1 rounded">{highlightPart}</span>
                    </>
                  );
                } else {
                  return <span className="text-blue-700">{baseStr}{numericPart}</span>;
                }
              })()}
            </div>
            <button
              onClick={() => copyToClipboard((paymentOrder?.totalAmount || 0).toString(), 'amount')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {copied === 'amount' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tersalin!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Salin
                </>
              )}
            </button>
          </div>
          
          {/* Amount breakdown */}
          <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Nominal asli:</span>
              <span>{formatCurrency(paymentOrder?.amount || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">Kode unik:</span>
              <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">+{paymentOrder?.uniqueCode}</span>
            </div>
          </div>
          
          {/* Visual explanation */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>3 digit terakhir berwarna <span className="text-red-600 font-bold">merah</span> adalah kode unik</span>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-yellow-700 font-medium">Penting!</p>
              <p className="text-sm text-yellow-600 mt-1">
                Transfer dengan nominal <strong>PERSIS</strong> seperti di atas. 
                Pembayaran akan diverifikasi oleh kasir.
              </p>
            </div>
          </div>
        </div>

        {/* Confirm Transfer Button */}
        <button
          onClick={handleConfirmTransfer}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Saya Sudah Transfer
        </button>

        {/* Manual verification info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-center text-sm text-blue-700">
            <span className="font-medium">Verifikasi Manual:</span> Pembayaran akan dikonfirmasi oleh kasir setelah Anda transfer.
          </p>
        </div>

        {/* Order Info */}
        <div className="text-center text-sm text-gray-500 pt-2 border-t">
          <div>ID Order: <span className="font-mono">{paymentOrder?.orderId}</span></div>
          <div>Pelanggan: {paymentOrder?.customerName}</div>
        </div>
      </div>
    </div>
  );
};

export default MootaPayment;
