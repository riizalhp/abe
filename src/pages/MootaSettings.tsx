import React, { useState, useEffect } from 'react';
import mootaService, { MootaSettings as MootaSettingsData, MootaBankAccount } from '../../services/mootaService';

export const MootaSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MootaSettingsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<MootaBankAccount[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    accessToken: '',
    bankAccountId: '',
    bankAccountName: '',
    accountNumber: '',
    bankType: '',
    secretToken: '',
    webhookUrl: '',
    uniqueCodeStart: 1,
    uniqueCodeEnd: 999,
    isActive: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await mootaService.getAllSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!formData.accessToken) {
      setError('Please enter access token first');
      return;
    }

    setIsTestingConnection(true);
    setError(null);
    setSuccess(null);

    try {
      // Set temporary token for testing
      mootaService.setTempToken(formData.accessToken);
      
      const result = await mootaService.testConnection();
      
      if (result.success && result.bankAccounts) {
        setBankAccounts(result.bankAccounts);
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      // Clear temp token after testing
      mootaService.clearTempToken();
      setIsTestingConnection(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleBankSelect = (bankId: string) => {
    const bank = bankAccounts.find(b => b.bank_id === bankId);
    if (bank) {
      setFormData(prev => ({
        ...prev,
        bankAccountId: bank.bank_id,
        bankAccountName: bank.atas_nama,
        accountNumber: bank.account_number,
        bankType: bank.bank_type
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await mootaService.updateSettings(editingId, formData);
        setSuccess('Settings updated successfully');
      } else {
        await mootaService.saveSettings(formData);
        setSuccess('Settings saved successfully');
      }

      resetForm();
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (setting: MootaSettingsData) => {
    setFormData({
      accessToken: setting.accessToken,
      bankAccountId: setting.bankAccountId,
      bankAccountName: setting.bankAccountName,
      accountNumber: setting.accountNumber,
      bankType: setting.bankType,
      secretToken: setting.secretToken,
      webhookUrl: setting.webhookUrl || '',
      uniqueCodeStart: setting.uniqueCodeStart,
      uniqueCodeEnd: setting.uniqueCodeEnd,
      isActive: setting.isActive
    });
    setEditingId(setting.id || null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return;

    setIsLoading(true);
    try {
      await mootaService.deleteSettings(id);
      setSuccess('Settings deleted successfully');
      await loadSettings();
    } catch (err) {
      setError('Failed to delete settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setIsLoading(true);
    try {
      await mootaService.updateSettings(id, { isActive: true });
      setSuccess('Active setting updated');
      await loadSettings();
    } catch (err) {
      setError('Failed to update active setting');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accessToken: '',
      bankAccountId: '',
      bankAccountName: '',
      accountNumber: '',
      bankType: '',
      secretToken: '',
      webhookUrl: '',
      uniqueCodeStart: 1,
      uniqueCodeEnd: 999,
      isActive: true
    });
    setEditingId(null);
    setIsEditing(false);
    setBankAccounts([]);
  };

  const generateSecretToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, secretToken: token }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moota Payment Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure Moota integration for automatic bank transfer payment verification
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Moota Configuration' : 'Add New Moota Configuration'}
          </h2>
          {isEditing && (
            <button
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: API Token */}
          <div className="border-b pb-6">
            <h3 className="text-md font-medium text-gray-700 mb-4">Step 1: API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moota Access Token <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    name="accessToken"
                    value={formData.accessToken}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your Moota API token"
                    required
                  />
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={isTestingConnection || !formData.accessToken}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isTestingConnection ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Get your API token from <a href="https://app.moota.co/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Moota Settings</a>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Bank Account Selection */}
          {bankAccounts.length > 0 && (
            <div className="border-b pb-6">
              <h3 className="text-md font-medium text-gray-700 mb-4">Step 2: Select Bank Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map(bank => (
                  <div
                    key={bank.bank_id}
                    onClick={() => handleBankSelect(bank.bank_id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.bankAccountId === bank.bank_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        {mootaService.getBankTypeName(bank.bank_type)}
                      </span>
                      {bank.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{bank.atas_nama}</p>
                    <p className="text-sm text-gray-500">{bank.account_number}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      {mootaService.formatCurrency(bank.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Configuration Details */}
          {formData.bankAccountId && (
            <div className="border-b pb-6">
              <h3 className="text-md font-medium text-gray-700 mb-4">Step 3: Configuration Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Token <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="secretToken"
                      value={formData.secretToken}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter secret token for webhook"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSecretToken}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Used for webhook verification</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    name="webhookUrl"
                    value={formData.webhookUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-domain.com/api/moota/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unique Code Start
                  </label>
                  <input
                    type="number"
                    name="uniqueCodeStart"
                    value={formData.uniqueCodeStart}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unique Code End
                  </label>
                  <input
                    type="number"
                    name="uniqueCodeEnd"
                    value={formData.uniqueCodeEnd}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as active configuration</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !formData.bankAccountId || !formData.secretToken}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Settings' : 'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Settings List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Saved Configurations</h2>
        
        {isLoading && settings.length === 0 ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p>No Moota configurations found.</p>
            <p className="text-sm mt-1">Add your first configuration above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Code Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settings.map(setting => (
                  <tr key={setting.id} className={setting.isActive ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {mootaService.getBankTypeName(setting.bankType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{setting.bankAccountName}</div>
                      <div className="text-sm text-gray-500">{setting.accountNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.uniqueCodeStart} - {setting.uniqueCodeEnd}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.isActive ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {!setting.isActive && (
                          <button
                            onClick={() => handleSetActive(setting.id!)}
                            className="text-green-600 hover:text-green-900"
                            title="Set as active"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(setting.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How it works</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
          <li>Customer receives a unique transfer amount (base amount + unique code)</li>
          <li>Moota monitors your bank account for incoming transfers</li>
          <li>When a matching transfer is detected, payment is automatically confirmed</li>
          <li>Unique codes ensure each payment can be identified accurately</li>
        </ul>
        <div className="mt-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Example:</strong> If customer needs to pay Rp 500.000 and unique code is 123, 
            they will transfer <strong>Rp 500.123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MootaSettingsPage;
