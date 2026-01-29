import React, { useState, useEffect } from 'react';
import { QRISUploader } from '../components/QRISUploader';
import qrisService, { QRISData } from '../../services/qrisService';

export const QRISSettings: React.FC = () => {
  const [qrisData, setQrisData] = useState<QRISData[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState<number>(50000);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    loadQRISData();
    loadDefaultAmount();
  }, []);

  const loadQRISData = () => {
    const data = qrisService.getAllQRISData();
    setQrisData(data);
  };

  const loadDefaultAmount = () => {
    const savedAmount = localStorage.getItem('qris_default_amount');
    if (savedAmount) {
      setDefaultAmount(parseInt(savedAmount, 10));
    }
  };

  const handleQrDecode = async (data: string | null, error?: string) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (error) {
      setUploadError(error);
      return;
    }

    if (!data) {
      setUploadError('No QRIS data found');
      return;
    }

    setIsLoading(true);

    try {
      // Validate QRIS
      if (!qrisService.validateQRIS(data)) {
        throw new Error('Invalid QRIS format or checksum');
      }

      // Get merchant name
      const merchantName = qrisService.getMerchantName(data);

      // Check if QRIS already exists
      const existingQris = qrisData.find(qris => qris.qrisString === data);
      if (existingQris) {
        throw new Error('This QRIS has already been added');
      }

      // Save QRIS data
      const newQrisData = qrisService.saveQRISData({
        merchantName,
        qrisString: data,
        isDefault: qrisData.length === 0 // Set as default if it's the first one
      });

      setUploadSuccess(`QRIS for ${merchantName} has been saved successfully`);
      loadQRISData();

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to save QRIS');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = (id: string) => {
    qrisService.updateQRISData(id, { isDefault: true });
    loadQRISData();
    setUploadSuccess('Default QRIS updated successfully');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this QRIS?')) {
      qrisService.deleteQRISData(id);
      loadQRISData();
      setUploadSuccess('QRIS deleted successfully');
    }
  };

  const handleAmountChange = (value: string) => {
    setAmountError(null);

    const numValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numValue)) {
      setDefaultAmount(0); // Allow clearing the input field
      localStorage.setItem('qris_default_amount', '0');
      setUploadSuccess('Default amount cleared');
      return;
    }

    if (numValue > 10000000) {
      setAmountError('Maximum amount is Rp 10,000,000');
      return;
    }

    setDefaultAmount(numValue);
    localStorage.setItem('qris_default_amount', numValue.toString());
    setUploadSuccess('Default amount updated successfully');

    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatInputValue = (value: number): string => {
    return value.toLocaleString('id-ID');
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QRIS Settings</h1>
        <p className="text-gray-600">
          Upload and manage your QRIS codes. Static QRIS will be converted to dynamic QRIS for payments.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New QRIS</h2>
        
        <QRISUploader onQrDecode={handleQrDecode} />

        {/* Status Messages */}
        {(uploadError || uploadSuccess || isLoading) && (
          <div className="mt-4">
            {isLoading && (
              <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <p className="text-blue-700">Processing QRIS...</p>
              </div>
            )}
            
            {uploadError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </p>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {uploadSuccess}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Default Amount Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Payment Amount</h2>
        <p className="text-gray-600 mb-4">
          Set the default amount for booking payments. This amount will be used when customers pay for their bookings.
        </p>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Booking Fee
          </label>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">Rp</span>
            </div>
            <input
              type="text"
              value={formatInputValue(defaultAmount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50,000"
            />
          </div>
          
          {amountError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {amountError}
            </p>
          )}
          
          <p className="mt-2 text-sm text-gray-500">
            Current default: <span className="font-medium text-gray-900">{formatCurrency(defaultAmount)}</span>
          </p>
        </div>
      </div>

      {/* QRIS List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Saved QRIS ({qrisData.length})
        </h2>

        {qrisData.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No QRIS saved yet</p>
            <p className="text-gray-400">Upload your first QRIS to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                      <h3 className="text-lg font-medium text-gray-900">
                        {qris.merchantName}
                      </h3>
                      {qris.isDefault && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Added on {formatDate(qris.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {qris.qrisString.substring(0, 50)}...
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {!qris.isDefault && (
                      <button
                        onClick={() => handleSetDefault(qris.id!)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(qris.id!)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">ℹ️ How it works</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Upload a static QRIS image (the QR code from your payment provider)</li>
          <li>• The system will automatically scan and validate the QR code</li>
          <li>• When customers make payments, the system converts it to dynamic QRIS with specific amounts</li>
          <li>• Set one QRIS as default to use for all payments</li>
          <li>• You can manage multiple QRIS codes for different purposes</li>
        </ul>
      </div>
    </div>
  );
};