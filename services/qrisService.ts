import { supabase } from '../lib/supabase';
import { SecurityUtils } from '../lib/security';
import { getStoredWorkshopId } from '../lib/WorkshopContext';

export interface QRISData {
  id?: string;
  merchantName: string;
  qrisString: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface DynamicQRISPayment {
  qrisString: string;
  amount: number;
  merchantName: string;
  feeType?: 'Persentase' | 'Rupiah';
  feeValue?: number;
}

class QRISService {
  private static instance: QRISService;
  private readonly STORAGE_KEY = 'qris_settings';
  private readonly TABLE_NAME = 'qris_settings';

  static getInstance(): QRISService {
    if (!QRISService.instance) {
      QRISService.instance = new QRISService();
    }
    return QRISService.instance;
  }

  // CRC-16 calculation for QRIS validation
  private crc16(str: string): string {
    let crc = 0xFFFF;
    const strlen = str.length;

    for (let c = 0; c < strlen; c++) {
      crc ^= str.charCodeAt(c) << 8;

      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }

    const hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
  }

  // Parse merchant name from QRIS string (Tag 59)
  private parseMerchantName(qrisString: string): string {
    try {
      const tag59Index = qrisString.indexOf('59');
      if (tag59Index === -1) return 'Unknown Merchant';

      const lengthStr = qrisString.substring(tag59Index + 2, tag59Index + 4);
      const length = parseInt(lengthStr, 10);

      if (isNaN(length)) return 'Unknown Merchant';

      const merchantName = qrisString.substring(tag59Index + 4, tag59Index + 4 + length);
      return merchantName || 'Unknown Merchant';
    } catch (error) {
      return 'Unknown Merchant';
    }
  }

  // Convert static QRIS to dynamic QRIS
  generateDynamicQris(
    staticQris: string,
    amount: number,
    feeType?: 'Persentase' | 'Rupiah',
    feeValue?: number
  ): string {
    try {
      const qrisWithoutCrc = staticQris.substring(0, staticQris.length - 4);
      const step1 = qrisWithoutCrc.replace('010211', '010212');
      const parts = step1.split('5802ID');

      if (parts.length !== 2) {
        throw new Error('Invalid QRIS format - country code not found');
      }

      const amountStr = Math.round(amount).toString();
      const amountTag = '54' + String(amountStr.length).padStart(2, '0') + amountStr;

      let feeTag = '';
      if (feeValue && feeValue > 0) {
        if (feeType === 'Rupiah') {
          const feeValueStr = Math.round(feeValue).toString();
          feeTag = '55020256' + String(feeValueStr.length).padStart(2, '0') + feeValueStr;
        } else if (feeType === 'Persentase') {
          const feeValueStr = feeValue.toString();
          feeTag = '55020357' + String(feeValueStr.length).padStart(2, '0') + feeValueStr;
        }
      }

      const payload = parts[0] + amountTag + feeTag + '5802ID' + parts[1];
      const finalCrc = this.crc16(payload);

      return payload + finalCrc;
    } catch (error) {
      throw new Error(`Failed to generate dynamic QRIS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // SUPABASE OPERATIONS (RPC for Custom Auth)
  // ============================================

  // Helper to get User ID
  private getUserId(): string | undefined {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.id;
      }
    } catch (e) {
      console.error('Failed to get user ID:', e);
    }
    return undefined;
  }

  // Save QRIS data to Supabase
  async saveQRISData(qrisData: Omit<QRISData, 'id' | 'createdAt'>): Promise<QRISData> {
    if (!SecurityUtils.checkRateLimit('qris_save', 5, 60000)) {
      throw new Error('Too many save attempts. Please wait.');
    }

    const userId = this.getUserId();

    if (!userId) {
      console.error('[QRIS] No user ID found (Custom Auth), cannot save to server.');
      return this.saveQRISDataLocal(qrisData);
    }

    try {
      const insertData = {
        p_merchant_name: SecurityUtils.sanitizeInput(qrisData.merchantName),
        p_qris_string: qrisData.qrisString,
        p_is_default: qrisData.isDefault,
        p_branch_id: (qrisData as any).branchId || null,
        p_user_id: userId
      };

      console.log('[QRIS] Saving via RPC:', insertData);

      const { data, error } = await supabase.rpc('save_qris_setting', insertData);

      if (error) {
        console.error('[QRIS] RPC Save Failed:', error);
        throw error;
      }

      // RPC returns array or single object depending on implementation, handle both
      const saved = Array.isArray(data) ? data[0] : data;

      const result: QRISData = {
        id: saved.id,
        merchantName: saved.merchant_name,
        qrisString: saved.qris_string,
        isDefault: saved.is_default,
        createdAt: new Date(saved.created_at)
      };

      this.syncToLocalStorage();
      return result;

    } catch (error) {
      console.warn('Supabase RPC error, falling back to localStorage:', error);
      return this.saveQRISDataLocal(qrisData);
    }
  }

  // Get all QRIS data from Supabase
  async getAllQRISData(branchId?: string): Promise<QRISData[]> {
    const userId = this.getUserId();

    if (!userId) {
      return this.getAllQRISDataLocal();
    }

    try {
      console.log('[QRIS] getAllQRISData RPC called with branchId:', branchId);

      const { data, error } = await supabase.rpc('get_qris_settings', {
        p_branch_id: branchId || null,
        p_user_id: userId
      });

      console.log('[QRIS] RPC Result:', { dataLength: data?.length, error });

      if (error) {
        console.warn('Supabase RPC fetch failed:', error);
        return this.getAllQRISDataLocal();
      }

      const decodeHtmlEntity = (str: string) => {
        return str.replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
      };

      return data.map((item: any) => ({
        id: item.id,
        merchantName: decodeHtmlEntity(item.merchant_name),
        qrisString: item.qris_string,
        isDefault: item.is_default,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.warn('Supabase error, using localStorage:', error);
      return this.getAllQRISDataLocal();
    }
  }

  // Get default QRIS from Supabase
  async getDefaultQRIS(): Promise<QRISData | null> {
    const all = await this.getAllQRISData();
    return all.find(q => q.isDefault) || null;
  }

  // Update QRIS data in Supabase
  async updateQRISData(id: string, updates: Partial<QRISData>): Promise<void> {
    const userId = this.getUserId();
    if (!userId) return;

    try {
      // For now, if just setting default, we have a specific RPC
      if (updates.isDefault === true) {
        await supabase.rpc('set_default_qris', {
          p_qris_id: id,
          p_user_id: userId
        });
        this.syncToLocalStorage();
        return;
      }

      console.warn('[QRIS] Full update RPC not implemented yet, using direct update (might fail RLS)');

      // Fallback to direct update (will likely fail if RLS is strict)
      const updateData: any = {};
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      this.syncToLocalStorage();

    } catch (error) {
      console.warn('Supabase update failed:', error);
      this.updateQRISDataLocal(id, updates);
    }
  }

  // Delete QRIS data from Supabase
  async deleteQRISData(id: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      this.deleteQRISDataLocal(id);
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_qris_setting', {
        p_qris_id: id,
        p_user_id: userId
      });

      if (error) {
        console.warn('Supabase RPC delete failed:', error);
        this.deleteQRISDataLocal(id); // Fallback
        return;
      }

      this.syncToLocalStorage();
    } catch (error) {
      console.warn('Supabase error, deleting from localStorage:', error);
      this.deleteQRISDataLocal(id);
    }
  }

  // ============================================
  // LOCALSTORAGE OPERATIONS (Fallback)
  // ============================================

  private saveQRISDataLocal(qrisData: Omit<QRISData, 'id' | 'createdAt'>): QRISData {
    const existingData = this.getAllQRISDataLocal();

    if (qrisData.isDefault) {
      existingData.forEach(data => {
        data.isDefault = false;
      });
    }

    const newData: QRISData = {
      id: SecurityUtils.generateSecureId(),
      merchantName: SecurityUtils.sanitizeInput(qrisData.merchantName),
      qrisString: qrisData.qrisString,
      isDefault: qrisData.isDefault,
      createdAt: new Date()
    };

    const updatedData = [newData, ...existingData].slice(0, 10);
    SecurityUtils.setSecureItem(this.STORAGE_KEY, updatedData);

    return newData;
  }

  private getAllQRISDataLocal(): QRISData[] {
    try {
      const data = SecurityUtils.getSecureItem(this.STORAGE_KEY);
      if (!data || !Array.isArray(data)) return [];

      return data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    } catch (error) {
      return [];
    }
  }

  private getDefaultQRISLocal(): QRISData | null {
    const allData = this.getAllQRISDataLocal();
    return allData.find(data => data.isDefault) || null;
  }

  private updateQRISDataLocal(id: string, updates: Partial<QRISData>): void {
    const allData = this.getAllQRISDataLocal();
    const index = allData.findIndex(data => data.id === id);

    if (index === -1) return;

    if (updates.isDefault) {
      allData.forEach(data => {
        data.isDefault = false;
      });
    }

    allData[index] = { ...allData[index], ...updates };
    SecurityUtils.setSecureItem(this.STORAGE_KEY, allData);
  }

  private deleteQRISDataLocal(id: string): void {
    const allData = this.getAllQRISDataLocal();
    const filteredData = allData.filter(data => data.id !== id);
    SecurityUtils.setSecureItem(this.STORAGE_KEY, filteredData);
  }

  // Sync Supabase data to localStorage for offline access
  private async syncToLocalStorage(): Promise<void> {
    try {
      const { data } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const qrisData = data.map((item: any) => ({
          id: item.id,
          merchantName: item.merchant_name,
          qrisString: item.qris_string,
          isDefault: item.is_default,
          createdAt: item.created_at
        }));
        SecurityUtils.setSecureItem(this.STORAGE_KEY, qrisData);
      }
    } catch (error) {
      console.warn('Failed to sync to localStorage:', error);
    }
  }

  // ============================================
  // VALIDATION & UTILITIES
  // ============================================

  validateQRIS(qrisString: string): boolean {
    try {
      if (!qrisString || qrisString.length < 50) return false;
      if (!qrisString.includes('00020101')) return false;
      if (!qrisString.includes('5802ID')) return false;

      const payload = qrisString.substring(0, qrisString.length - 4);
      const providedCrc = qrisString.substring(qrisString.length - 4);
      const calculatedCrc = this.crc16(payload);

      return providedCrc === calculatedCrc;
    } catch (error) {
      return false;
    }
  }

  getMerchantName(qrisString: string): string {
    return this.parseMerchantName(qrisString);
  }

  getDefaultAmount(): number {
    const savedAmount = SecurityUtils.getSecureItem('qris_default_amount');
    return savedAmount ? parseInt(savedAmount, 10) : 0;
  }

  setDefaultAmount(amount: number): void {
    if (amount < 0 || amount > 10000000) {
      throw new Error('Invalid amount range');
    }
    SecurityUtils.setSecureItem('qris_default_amount', amount.toString());
  }
}

export default QRISService.getInstance();
