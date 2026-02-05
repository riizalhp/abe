import React, { useRef, useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';
import qrisService from '../../services/qrisService';

interface QRISPaymentProps {
  amount: number;
  description?: string;
  feeType?: 'Persentase' | 'Rupiah';
  feeValue?: number;
  onPaymentComplete?: () => void;
  onCancel?: () => void;
  branchId?: string;
}

export const QRISPayment: React.FC<QRISPaymentProps> = ({
  amount,
  description = 'Service Payment',
  feeType,
  feeValue,
  onPaymentComplete,
  onCancel,
  branchId
}) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [qrisData, setQrisData] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState<number>(amount);

  useEffect(() => {
    generateDynamicQRIS();
  }, [amount, feeType, feeValue, branchId]);

  useEffect(() => {
    if (qrisData && qrCodeRef.current) {
      renderQRCode();
    }
  }, [qrisData]);

  const generateDynamicQRIS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get default QRIS
      const defaultQris = await qrisService.getDefaultQRIS(branchId);

      if (!defaultQris) {
        throw new Error('No default QRIS found. Please configure QRIS in settings first.');
      }

      // Calculate total amount including fee
      let calculatedTotal = amount;
      if (feeValue && feeValue > 0) {
        if (feeType === 'Persentase') {
          calculatedTotal = amount + (amount * feeValue / 100);
        } else {
          calculatedTotal = amount + feeValue;
        }
      }

      setTotalAmount(calculatedTotal);

      // Generate dynamic QRIS
      const dynamicQris = qrisService.generateDynamicQris(
        defaultQris.qrisString,
        calculatedTotal,
        feeType,
        feeValue
      );

      setQrisData(dynamicQris);
      setMerchantName(defaultQris.merchantName);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate QRIS');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQRCode = () => {
    if (!qrisData || !qrCodeRef.current) return;

    try {
      // Clear previous QR code
      qrCodeRef.current.innerHTML = '';

      // Generate QR code
      const qr = qrcode(0, 'M');
      qr.addData(qrisData);
      qr.make();

      // Create image element
      const qrImage = qr.createImgTag(4, 8);
      qrCodeRef.current.innerHTML = qrImage;

      // Style the image
      const img = qrCodeRef.current.querySelector('img');
      if (img) {
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxWidth = '300px';
        img.style.imageRendering = 'pixelated';
      }
    } catch (error) {
      setError('Failed to render QR code');
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const copyQRISData = async () => {
    if (!qrisData) return;

    try {
      await navigator.clipboard.writeText(qrisData);
      // You might want to show a toast notification here
      alert('QRIS data copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = qrisData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('QRIS data copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Generating QRIS...</p>
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Payment Error</h3>
          <p className="text-red-700 mb-4">{error}</p>

          <div className="space-x-3">
            <button
              onClick={generateDynamicQRIS}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment</h2>
        <p className="text-gray-600">{merchantName}</p>
      </div>

      {/* Amount Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{description}</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>

          {feeValue && feeValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Fee ({feeType === 'Persentase' ? `${feeValue}%` : formatCurrency(feeValue)})
              </span>
              <span className="text-gray-500">
                {feeType === 'Persentase'
                  ? formatCurrency(amount * feeValue / 100)
                  : formatCurrency(feeValue)
                }
              </span>
            </div>
          )}

          <hr className="border-gray-300" />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center mb-6">
        <div
          ref={qrCodeRef}
          className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-2">Scan this QR code with your mobile banking app</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={copyQRISData}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy QRIS Data
        </button>

        {onPaymentComplete && (
          <button
            onClick={onPaymentComplete}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark as Paid
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel Payment
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Open your mobile banking app</li>
          <li>2. Select QRIS or QR payment</li>
          <li>3. Scan the QR code above</li>
          <li>4. Verify the amount and pay</li>
          <li>5. Show payment confirmation to staff</li>
        </ol>
      </div>
    </div>
  );
};