import React, { useState, useEffect, useCallback, useRef } from 'react';
import mootaService, { PaymentOrder, MootaSettings } from '../../services/mootaService';

interface MootaPaymentProps {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  description?: string;
  onPaymentComplete?: (order: PaymentOrder) => void;
  onPaymentExpired?: () => void;
  onCancel?: () => void;
  autoCheck?: boolean;
  checkInterval?: number; // in seconds
}

export const MootaPayment: React.FC<MootaPaymentProps> = ({
  amount,
  orderId,
  customerName,
  customerPhone,
  description,
  onPaymentComplete,
  onPaymentExpired,
  onCancel,
  autoCheck = true,
  checkInterval = 30 // Check every 30 seconds
}) => {
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [settings, setSettings] = useState<MootaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState<'amount' | 'account' | null>(null);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize payment
  useEffect(() => {
    initializePayment();
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [orderId, amount]);

  // Auto-check payment status
  useEffect(() => {
    if (autoCheck && paymentOrder && !isPaid && paymentOrder.status === 'PENDING') {
      checkIntervalRef.current = setInterval(() => {
        checkPaymentStatus();
      }, checkInterval * 1000);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [autoCheck, paymentOrder, isPaid, checkInterval]);

  // Countdown timer
  useEffect(() => {
    if (paymentOrder?.expiresAt && !isPaid) {
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [paymentOrder?.expiresAt, isPaid]);

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

      if (order.status === 'PAID') {
        setIsPaid(true);
        onPaymentComplete?.(order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentOrder || isPaid || isChecking) return;

    setIsChecking(true);
    try {
      const result = await mootaService.checkPaymentStatus(paymentOrder.orderId);
      
      if (result.isPaid) {
        setIsPaid(true);
        const updatedOrder = await mootaService.getPaymentOrder(paymentOrder.orderId);
        if (updatedOrder) {
          setPaymentOrder(updatedOrder);
          onPaymentComplete?.(updatedOrder);
        }
      }
    } catch (err) {
      console.error('Payment check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'amount' | 'account') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      // Fallback
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

  if (isPaid) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h3>
          <p className="text-gray-600 mb-4">
            Terima kasih! Pembayaran sebesar {formatCurrency(paymentOrder?.totalAmount || 0)} telah diterima.
          </p>
          <div className="text-sm text-gray-500">
            ID Order: {paymentOrder?.orderId}
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
              {/* Highlight last 3 digits (unique code) in red */}
              {(() => {
                const totalStr = (paymentOrder?.totalAmount || 0).toLocaleString('id-ID');
                const baseStr = 'Rp ';
                // Find where the unique code digits are (last 3 digits before any separator)
                const numericPart = (paymentOrder?.totalAmount || 0).toString();
                const uniqueCodeDigits = paymentOrder?.uniqueCode?.toString().padStart(3, '0') || '000';
                
                // Split the formatted number to highlight last 3 digit positions
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
                  return <span className="text-blue-700">{baseStr}{totalStr}</span>;
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
          
          {/* Amount breakdown with highlighted unique code */}
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
                Nominal berbeda tidak dapat diverifikasi otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Check Payment Button */}
        <button
          onClick={checkPaymentStatus}
          disabled={isChecking}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          {isChecking ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memeriksa Pembayaran...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Saya Sudah Transfer
            </>
          )}
        </button>

        {/* Auto-check indicator */}
        {autoCheck && (
          <p className="text-center text-sm text-gray-500">
            Status pembayaran diperiksa otomatis setiap {checkInterval} detik
          </p>
        )}

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
