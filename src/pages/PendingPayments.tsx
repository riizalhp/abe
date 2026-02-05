import React, { useState, useEffect, useCallback } from 'react';
import mootaService, { PaymentOrder } from '../../services/mootaService';
import { bookingService } from '../../services/bookingService';
import { BookingStatus } from '../../types';
import { useBranch } from '../../lib/BranchContext';

/**
 * PendingPayments - Halaman verifikasi pembayaran Moota untuk Admin/Kasir
 * 
 * Alur Manual:
 * 1. Admin melihat daftar pembayaran yang menunggu verifikasi
 * 2. Admin cek mutasi di dashboard Moota (moota.co)
 * 3. Admin cocokkan nominal + kode unik
 * 4. Admin klik "Verifikasi" jika sudah sesuai
 */
const PendingPayments: React.FC = () => {
  const { activeBranch } = useBranch();
  const [pendingOrders, setPendingOrders] = useState<PaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPendingOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const orders = await mootaService.getPendingPaymentOrders();
      setPendingOrders(orders);
    } catch (error) {
      console.error('Failed to load pending orders:', error);
      setErrorMessage('Gagal memuat daftar pembayaran');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingOrders();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [loadPendingOrders]);

  const handleVerifyPayment = async (order: PaymentOrder) => {
    if (!order.orderId) return;
    
    setVerifyingId(order.orderId);
    setErrorMessage(null);
    
    try {
      // Update payment order status to PAID
      await mootaService.updatePaymentOrderStatus(order.orderId, 'PAID');
      
      // Update booking status to CONFIRMED if booking exists with this orderId
      try {
        const bookings = await bookingService.getAll();
        const matchingBooking = bookings.find(b => b.bookingCode === order.orderId);
        if (matchingBooking) {
          await bookingService.updateStatus(matchingBooking.id, BookingStatus.CONFIRMED);
          console.log('[PendingPayments] Booking status updated to CONFIRMED:', matchingBooking.id);
        }
      } catch (bookingError) {
        console.warn('Could not update booking status:', bookingError);
      }
      
      setSuccessMessage(`Pembayaran ${order.orderId} berhasil diverifikasi!`);
      
      // Refresh list
      await loadPendingOrders();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to verify payment:', error);
      setErrorMessage('Gagal memverifikasi pembayaran');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCancelPayment = async (order: PaymentOrder) => {
    if (!order.orderId) return;
    
    if (!window.confirm(`Batalkan pembayaran ${order.orderId}?`)) return;
    
    setVerifyingId(order.orderId);
    setErrorMessage(null);
    
    try {
      await mootaService.updatePaymentOrderStatus(order.orderId, 'CANCELLED');
      setSuccessMessage(`Pembayaran ${order.orderId} dibatalkan`);
      
      await loadPendingOrders();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      setErrorMessage('Gagal membatalkan pembayaran');
    } finally {
      setVerifyingId(null);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date?: Date): string => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Menunggu Transfer</span>;
      case 'CHECKING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Menunggu Verifikasi</span>;
      case 'PAID':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Terverifikasi</span>;
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Kadaluarsa</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Dibatalkan</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
            <p className="text-gray-600 mt-1">
              Verifikasi manual pembayaran transfer bank (Moota)
            </p>
          </div>
          <button
            onClick={loadPendingOrders}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {activeBranch && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <span className="material-symbols-outlined text-sm mr-1">store</span>
            {activeBranch.name}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800">Cara Verifikasi Manual</h3>
            <ol className="mt-2 text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Buka dashboard Moota di <a href="https://app.moota.co" target="_blank" rel="noopener noreferrer" className="underline font-medium">app.moota.co</a></li>
              <li>Cek mutasi masuk (Credit/CR)</li>
              <li>Cocokkan <strong>nominal transfer</strong> dengan <strong>Total Amount</strong> di bawah</li>
              <li>Jika cocok, klik tombol <strong>"Verifikasi"</strong></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Pending Orders List */}
      {isLoading && pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Memuat daftar pembayaran...</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Pembayaran Pending</h3>
          <p className="text-gray-600">Semua pembayaran sudah diverifikasi atau belum ada booking baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. HP</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Transfer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kode Unik</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <tr key={order.orderId} className={`hover:bg-gray-50 ${order.status === 'CHECKING' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-900">{order.orderId}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-900 font-medium">{order.customerName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-600">{order.customerPhone}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-lg text-blue-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded">
                        {order.uniqueCode}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerifyPayment(order)}
                          disabled={verifyingId === order.orderId}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {verifyingId === order.orderId ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Verifikasi
                        </button>
                        <button
                          onClick={() => handleCancelPayment(order)}
                          disabled={verifyingId === order.orderId}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          Batalkan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {pendingOrders.filter(o => o.status === 'PENDING').length}
          </div>
          <div className="text-sm text-gray-600">Menunggu Transfer</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingOrders.filter(o => o.status === 'CHECKING').length}
          </div>
          <div className="text-sm text-gray-600">Perlu Verifikasi</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Pending</div>
        </div>
      </div>
    </div>
  );
};

export default PendingPayments;
