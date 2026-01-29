import { SecurityUtils } from '../lib/security';
import { PerformanceUtils } from '../lib/performance';

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
      // Look for tag 59 (merchant name)
      const tag59Index = qrisString.indexOf('59');
      if (tag59Index === -1) return 'Unknown Merchant';
      
      // Get length (2 digits after '59')
      const lengthStr = qrisString.substring(tag59Index + 2, tag59Index + 4);
      const length = parseInt(lengthStr, 10);
      
      if (isNaN(length)) return 'Unknown Merchant';
      
      // Extract merchant name
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
      // Step 1: Remove old CRC (last 4 characters)
      const qrisWithoutCrc = staticQris.substring(0, staticQris.length - 4);
      
      // Step 2: Change static indicator (010211) to dynamic (010212)
      const step1 = qrisWithoutCrc.replace('010211', '010212');
      
      // Step 3: Split by country code "5802ID"
      const parts = step1.split('5802ID');
      if (parts.length !== 2) {
        throw new Error('Invalid QRIS format - country code not found');
      }
      
      // Step 4: Create amount tag (Tag 54)
      const amountStr = Math.round(amount).toString();
      const amountTag = '54' + String(amountStr.length).padStart(2, '0') + amountStr;
      
      // Step 5: Create fee tag (optional)
      let feeTag = '';
      if (feeValue && feeValue > 0) {
        if (feeType === 'Rupiah') {
          // Fixed fee: 55020256 + length + value
          const feeValueStr = Math.round(feeValue).toString();
          feeTag = '55020256' + String(feeValueStr.length).padStart(2, '0') + feeValueStr;
        } else if (feeType === 'Persentase') {
          // Percentage fee: 55020357 + length + value
          const feeValueStr = feeValue.toString();
          feeTag = '55020357' + String(feeValueStr.length).padStart(2, '0') + feeValueStr;
        }
      }
      
      // Step 6: Combine all parts
      const payload = parts[0] + amountTag + feeTag + '5802ID' + parts[1];
      
      // Step 7: Calculate new CRC and append
      const finalCrc = this.crc16(payload);
      
      return payload + finalCrc;
    } catch (error) {
      throw new Error(`Failed to generate dynamic QRIS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Save QRIS data to localStorage with encryption and validation
  saveQRISData(qrisData: Omit<QRISData, 'id' | 'createdAt'>): QRISData {
    // Rate limiting check
    if (!SecurityUtils.checkRateLimit('qris_save', 5, 60000)) {
      throw new Error('Too many save attempts. Please wait.');
    }

    const existingData = this.getAllQRISData();
    
    // If setting as default, remove default from others
    if (qrisData.isDefault) {
      existingData.forEach(data => {
        data.isDefault = false;
      });
    }
    
    const newData: QRISData = {
      id: SecurityUtils.generateSecureId(),
      merchantName: SecurityUtils.sanitizeInput(qrisData.merchantName),
      qrisString: SecurityUtils.sanitizeInput(qrisData.qrisString),
      isDefault: qrisData.isDefault,
      createdAt: new Date()
    };
    
    const updatedData = [newData, ...existingData];
    
    // Keep only last 10 QRIS
    const limitedData = updatedData.slice(0, 10);
    
    SecurityUtils.setSecureItem(this.STORAGE_KEY, limitedData);
    return newData;
  }

  // Get all QRIS data from localStorage with decryption
  getAllQRISData(): QRISData[] {
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

  // Get default QRIS
  getDefaultQRIS(): QRISData | null {
    const allData = this.getAllQRISData();
    return allData.find(data => data.isDefault) || null;
  }

  // Update QRIS data
  updateQRISData(id: string, updates: Partial<QRISData>): void {
    const allData = this.getAllQRISData();
    const index = allData.findIndex(data => data.id === id);
    
    if (index === -1) return;
    
    // If setting as default, remove default from others
    if (updates.isDefault) {
      allData.forEach(data => {
        data.isDefault = false;
      });
    }
    
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
  }

  // Delete QRIS data
  deleteQRISData(id: string): void {
    const allData = this.getAllQRISData();
    const filteredData = allData.filter(data => data.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData));
  }

  // Validate QRIS string
  validateQRIS(qrisString: string): boolean {
    try {
      // Basic validation
      if (!qrisString || qrisString.length < 50) return false;
      
      // Check if contains required QRIS elements
      if (!qrisString.includes('00020101')) return false;
      if (!qrisString.includes('5802ID')) return false;
      
      // Validate CRC
      const payload = qrisString.substring(0, qrisString.length - 4);
      const providedCrc = qrisString.substring(qrisString.length - 4);
      const calculatedCrc = this.crc16(payload);
      
      return providedCrc === calculatedCrc;
    } catch (error) {
      return false;
    }
  }

  // Get merchant name from QRIS string
  getMerchantName(qrisString: string): string {
    return this.parseMerchantName(qrisString);
  }

  // Get default payment amount
  getDefaultAmount(): number {
    const savedAmount = localStorage.getItem('qris_default_amount');
    return savedAmount ? parseInt(savedAmount, 10) : 0; // Default to 0 if cleared
  }

  // Set default payment amount
  // Save default amount with validation and encryption
  setDefaultAmount(amount: number): void {
    if (amount < 0 || amount > 10000000) { // Max 10M
      throw new Error('Invalid amount range');
    }
    SecurityUtils.setSecureItem('qris_default_amount', amount.toString());
  }
}

export default QRISService.getInstance();