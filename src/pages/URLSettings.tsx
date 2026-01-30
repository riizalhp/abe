import React, { useState } from 'react';
import { useWorkshop } from '../../lib/WorkshopContext';

export const URLSettings: React.FC = () => {
  const { currentWorkshop } = useWorkshop();
  const [copiedUrl, setCopiedUrl] = useState(false);

  const bookingUrl = currentWorkshop 
    ? `${window.location.origin}/booking/${currentWorkshop.slug}` 
    : '';

  const trackingUrl = currentWorkshop 
    ? `${window.location.origin}/tracking` 
    : '';

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!currentWorkshop) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            No workshop selected. Please login to view URL settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">link</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">URL Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your public booking and tracking URLs
          </p>
        </div>
      </div>

      {/* Workshop Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-2xl">store</span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentWorkshop.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Slug: <span className="font-mono font-medium">{currentWorkshop.slug}</span>
            </p>
          </div>
        </div>
        
        {currentWorkshop.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {currentWorkshop.description}
          </p>
        )}
      </div>

      {/* Booking URL Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">calendar_month</span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Online Booking URL</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share this URL with customers to allow them to book services online
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Public Booking URL</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded px-3 py-2 border border-slate-300 dark:border-slate-600">
                <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                  {bookingUrl}
                </p>
              </div>
              <button
                onClick={() => handleCopyUrl(bookingUrl)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">
                  {copiedUrl ? 'check' : 'content_copy'}
                </span>
                <span className="text-sm font-medium">
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  How to use this URL
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Share this link on your social media (WhatsApp, Instagram, Facebook)</li>
                  <li>• Add it to your website or Google My Business profile</li>
                  <li>• Print QR code from this URL for offline marketing materials</li>
                  <li>• Customers can book services 24/7 without calling</li>
                </ul>
              </div>
            </div>
          </div>

          {/* QR Code Preview Placeholder */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">qr_code</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">QR Code</p>
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(bookingUrl)}`}
                download={`booking-qr-${currentWorkshop.slug}.png`}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download QR
              </a>
            </div>
            <div className="flex justify-center bg-white dark:bg-slate-800 rounded-lg p-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}`}
                alt="Booking QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking URL Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">search</span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order Tracking URL</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Customers can track their service progress using booking code
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Public Tracking URL</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded px-3 py-2 border border-slate-300 dark:border-slate-600">
                <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                  {trackingUrl}
                </p>
              </div>
              <button
                onClick={() => handleCopyUrl(trackingUrl)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">
                  {copiedUrl ? 'check' : 'content_copy'}
                </span>
                <span className="text-sm font-medium">
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">info</span>
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                  Tracking Features
                </h3>
                <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Customers enter their booking code to check service status</li>
                  <li>• Real-time updates on service progress</li>
                  <li>• View estimated completion time</li>
                  <li>• Access service details and payment information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">lightbulb</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Marketing Tips
            </h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong className="text-blue-600 dark:text-blue-400">WhatsApp Business:</strong> 
                Add the booking URL to your WhatsApp Business profile and auto-reply messages
              </p>
              <p>
                <strong className="text-purple-600 dark:text-purple-400">Instagram Bio:</strong> 
                Put the booking link in your Instagram bio for easy access
              </p>
              <p>
                <strong className="text-green-600 dark:text-green-400">Google My Business:</strong> 
                Add the booking URL as a website link or appointment booking link
              </p>
              <p>
                <strong className="text-orange-600 dark:text-orange-400">Printed Materials:</strong> 
                Print the QR code on business cards, flyers, and workshop signage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLSettings;
