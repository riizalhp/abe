import { supabase } from '../lib/supabase';
import { SecurityUtils } from '../lib/security';
import { getStoredWorkshopId } from '../lib/WorkshopContext';
import { getStoredBranchId } from '../lib/BranchContext';

// Moota API Configuration
const MOOTA_API_BASE_URL = 'https://app.moota.co/api/v2';

export interface MootaSettings {
  id?: string;
  accessToken: string;
  bankAccountId: string;
  bankAccountName: string;
  accountNumber: string;
  bankType: string;
  secretToken: string;
  webhookUrl?: string;
  uniqueCodeStart: number;
  uniqueCodeEnd: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MootaMutation {
  id: string;
  bank_id: string;
  account_number: string;
  bank_type: string;
  date: string;
  amount: number;
  description: string;
  type: 'CR' | 'DB'; // CR = Credit, DB = Debit
  balance: number;
  note?: string;
  created_at: string;
  mutation_id: string;
  tag?: string[];
}

export interface MootaBankAccount {
  bank_id: string;
  username: string;
  atas_nama: string;
  account_number: string;
  bank_type: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentOrder {
  id?: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  uniqueCode: number;
  totalAmount: number;
  status: 'PENDING' | 'CHECKING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  bankAccountId: string;
  mutationId?: string;
  description?: string;
  createdAt?: Date;
  expiresAt?: Date;
  paidAt?: Date;
}

export interface WebhookPayload {
  id: string;
  bank_id: string;
  account_number: string;
  bank_type: string;
  date: string;
  amount: number;
  description: string;
  type: 'CR' | 'DB';
  balance: number;
  created_at?: string;
  updated_at?: string;
}

class MootaService {
  private static instance: MootaService;
  private readonly TABLE_NAME = 'moota_settings';
  private readonly ORDERS_TABLE = 'payment_orders';
  private accessToken: string | null = null;
  private tempToken: string | null = null; // For testing connection

  static getInstance(): MootaService {
    if (!MootaService.instance) {
      MootaService.instance = new MootaService();
    }
    return MootaService.instance;
  }

  // Set temporary token for testing (not saved to DB)
  setTempToken(token: string): void {
    this.tempToken = token;
  }

  // Clear temporary token
  clearTempToken(): void {
    this.tempToken = null;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  private async getAccessToken(): Promise<string> {
    // Use temp token first if available (for testing)
    if (this.tempToken) {
      return this.tempToken;
    }

    if (this.accessToken) {
      return this.accessToken;
    }

    const settings = await this.getActiveSettings();
    if (!settings?.accessToken) {
      throw new Error('Moota access token not configured. Please configure in Settings.');
    }

    this.accessToken = settings.accessToken;
    return this.accessToken;
  }

  private async makeApiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${MOOTA_API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Moota API Error:', error);
      throw error;
    }
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  async saveSettings(settings: Omit<MootaSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<MootaSettings> {
    if (!SecurityUtils.checkRateLimit('moota_save', 5, 60000)) {
      throw new Error('Too many save attempts. Please wait.');
    }

    try {
      const branchId = getStoredBranchId();
      const workshopId = getStoredWorkshopId();
      
      // Deactivate existing settings if new one is active
      if (settings.isActive) {
        let updateQuery = supabase
          .from(this.TABLE_NAME)
          .update({ is_active: false })
          .eq('is_active', true);
        
        if (branchId) {
          updateQuery = updateQuery.eq('branch_id', branchId);
        }
        
        await updateQuery;
      }

      const insertData: any = {
        access_token: settings.accessToken,
        bank_account_id: settings.bankAccountId,
        bank_account_name: SecurityUtils.sanitizeInput(settings.bankAccountName),
        account_number: settings.accountNumber,
        bank_type: settings.bankType,
        secret_token: settings.secretToken,
        webhook_url: settings.webhookUrl,
        unique_code_start: settings.uniqueCodeStart,
        unique_code_end: settings.uniqueCodeEnd,
        is_active: settings.isActive
      };
      
      if (branchId) {
        insertData.branch_id = branchId;
      }
      if (workshopId) {
        insertData.workshop_id = workshopId;
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Clear cached token to force reload
      this.accessToken = null;

      return this.mapToMootaSettings(data);
    } catch (error) {
      console.error('Failed to save Moota settings:', error);
      throw new Error('Failed to save Moota settings');
    }
  }

  async getActiveSettings(): Promise<MootaSettings | null> {
    try {
      const branchId = getStoredBranchId();
      
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_active', true);
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.single();

      if (error || !data) return null;

      return this.mapToMootaSettings(data);
    } catch (error) {
      console.error('Failed to get active Moota settings:', error);
      return null;
    }
  }

  async getAllSettings(): Promise<MootaSettings[]> {
    try {
      const branchId = getStoredBranchId();
      
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToMootaSettings);
    } catch (error) {
      console.error('Failed to get Moota settings:', error);
      return [];
    }
  }

  async updateSettings(id: string, updates: Partial<MootaSettings>): Promise<void> {
    try {
      const branchId = getStoredBranchId();
      
      if (updates.isActive) {
        let updateQuery = supabase
          .from(this.TABLE_NAME)
          .update({ is_active: false })
          .eq('is_active', true);
        
        if (branchId) {
          updateQuery = updateQuery.eq('branch_id', branchId);
        }
        
        await updateQuery;
      }

      const updateData: any = {};
      if (updates.accessToken) updateData.access_token = updates.accessToken;
      if (updates.bankAccountId) updateData.bank_account_id = updates.bankAccountId;
      if (updates.bankAccountName) updateData.bank_account_name = SecurityUtils.sanitizeInput(updates.bankAccountName);
      if (updates.accountNumber) updateData.account_number = updates.accountNumber;
      if (updates.bankType) updateData.bank_type = updates.bankType;
      if (updates.secretToken) updateData.secret_token = updates.secretToken;
      if (updates.webhookUrl) updateData.webhook_url = updates.webhookUrl;
      if (updates.uniqueCodeStart !== undefined) updateData.unique_code_start = updates.uniqueCodeStart;
      if (updates.uniqueCodeEnd !== undefined) updateData.unique_code_end = updates.uniqueCodeEnd;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      let query = supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id);
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { error } = await query;

      if (error) throw error;

      // Clear cached token
      this.accessToken = null;
    } catch (error) {
      console.error('Failed to update Moota settings:', error);
      throw new Error('Failed to update Moota settings');
    }
  }

  async deleteSettings(id: string): Promise<void> {
    try {
      const branchId = getStoredBranchId();
      
      let query = supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { error } = await query;

      if (error) throw error;
      this.accessToken = null;
    } catch (error) {
      console.error('Failed to delete Moota settings:', error);
      throw new Error('Failed to delete Moota settings');
    }
  }

  private mapToMootaSettings(data: any): MootaSettings {
    return {
      id: data.id,
      accessToken: data.access_token,
      bankAccountId: data.bank_account_id,
      bankAccountName: data.bank_account_name,
      accountNumber: data.account_number,
      bankType: data.bank_type,
      secretToken: data.secret_token,
      webhookUrl: data.webhook_url,
      uniqueCodeStart: data.unique_code_start,
      uniqueCodeEnd: data.unique_code_end,
      isActive: data.is_active,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  // ============================================
  // BANK ACCOUNT OPERATIONS
  // ============================================

  async getBankAccounts(): Promise<MootaBankAccount[]> {
    try {
      const response = await this.makeApiRequest<{ data: MootaBankAccount[] }>('/bank');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get bank accounts:', error);
      throw error;
    }
  }

  async refreshBankMutation(bankId: string): Promise<void> {
    try {
      await this.makeApiRequest(`/bank/${bankId}/refresh`, 'POST');
    } catch (error) {
      console.error('Failed to refresh mutation:', error);
      throw error;
    }
  }

  // ============================================
  // MUTATION OPERATIONS
  // ============================================

  async getMutations(params?: {
    bankId?: string;
    type?: 'CR' | 'DB';
    amount?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ data: MootaMutation[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.bankId) queryParams.append('bank', params.bankId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.amount) queryParams.append('amount', params.amount.toString());
      if (params?.startDate) queryParams.append('start_date', params.startDate);
      if (params?.endDate) queryParams.append('end_date', params.endDate);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.perPage) queryParams.append('per_page', params.perPage.toString());

      const response = await this.makeApiRequest<{ data: MootaMutation[]; total: number }>(
        `/mutation?${queryParams.toString()}`
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get mutations:', error);
      throw error;
    }
  }

  async searchMutationByAmount(bankId: string, amount: number): Promise<MootaMutation[]> {
    try {
      const response = await this.makeApiRequest<{ mutation: MootaMutation[] }>(
        `/bank/${bankId}/mutation/search/${amount}`
      );
      return response.mutation || [];
    } catch (error) {
      console.error('Failed to search mutation:', error);
      return [];
    }
  }

  // ============================================
  // PAYMENT ORDER MANAGEMENT
  // ============================================

  async createPaymentOrder(
    orderId: string,
    customerName: string,
    customerPhone: string,
    amount: number,
    description?: string
  ): Promise<PaymentOrder> {
    try {
      const settings = await this.getActiveSettings();
      if (!settings) {
        throw new Error('Moota settings not configured');
      }

      // Generate unique code
      const uniqueCode = await this.generateUniqueCode(settings);
      const totalAmount = amount + uniqueCode;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      const { data, error } = await supabase
        .from(this.ORDERS_TABLE)
        .insert({
          order_id: orderId,
          customer_name: SecurityUtils.sanitizeInput(customerName),
          customer_phone: customerPhone,
          amount: amount,
          unique_code: uniqueCode,
          total_amount: totalAmount,
          status: 'PENDING',
          bank_account_id: settings.bankAccountId,
          description: description ? SecurityUtils.sanitizeInput(description) : null,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToPaymentOrder(data);
    } catch (error) {
      console.error('Failed to create payment order:', error);
      throw error;
    }
  }

  async getPaymentOrder(orderId: string): Promise<PaymentOrder | null> {
    try {
      const { data, error } = await supabase
        .from(this.ORDERS_TABLE)
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error || !data) return null;

      return this.mapToPaymentOrder(data);
    } catch (error) {
      console.error('Failed to get payment order:', error);
      return null;
    }
  }

  async getPaymentOrderById(id: string): Promise<PaymentOrder | null> {
    try {
      const { data, error } = await supabase
        .from(this.ORDERS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return this.mapToPaymentOrder(data);
    } catch (error) {
      console.error('Failed to get payment order:', error);
      return null;
    }
  }

  async getPendingPaymentOrders(): Promise<PaymentOrder[]> {
    try {
      const { data, error } = await supabase
        .from(this.ORDERS_TABLE)
        .select('*')
        .in('status', ['PENDING', 'CHECKING'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToPaymentOrder);
    } catch (error) {
      console.error('Failed to get pending orders:', error);
      return [];
    }
  }

  async updatePaymentOrderStatus(
    orderId: string,
    status: PaymentOrder['status'],
    mutationId?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === 'PAID') {
        updateData.paid_at = new Date().toISOString();
      }
      if (mutationId) {
        updateData.mutation_id = mutationId;
      }

      const { error } = await supabase
        .from(this.ORDERS_TABLE)
        .update(updateData)
        .eq('order_id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update payment order:', error);
      throw error;
    }
  }

  private async generateUniqueCode(settings: MootaSettings): Promise<number> {
    // Get used unique codes for today
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from(this.ORDERS_TABLE)
      .select('unique_code')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    const usedCodes = new Set((data || []).map(d => d.unique_code));

    // Generate random unique code within range
    const range = settings.uniqueCodeEnd - settings.uniqueCodeStart + 1;
    let uniqueCode: number;
    let attempts = 0;
    const maxAttempts = range;

    do {
      uniqueCode = settings.uniqueCodeStart + Math.floor(Math.random() * range);
      attempts++;
    } while (usedCodes.has(uniqueCode) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique code. All codes for today are used.');
    }

    return uniqueCode;
  }

  private mapToPaymentOrder(data: any): PaymentOrder {
    return {
      id: data.id,
      orderId: data.order_id,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      amount: data.amount,
      uniqueCode: data.unique_code,
      totalAmount: data.total_amount,
      status: data.status,
      bankAccountId: data.bank_account_id,
      mutationId: data.mutation_id,
      description: data.description,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined
    };
  }

  // ============================================
  // PAYMENT VERIFICATION
  // ============================================

  async checkPaymentStatus(orderId: string): Promise<{ isPaid: boolean; mutation?: MootaMutation }> {
    try {
      const order = await this.getPaymentOrder(orderId);
      if (!order) {
        throw new Error('Payment order not found');
      }

      if (order.status === 'PAID') {
        return { isPaid: true };
      }

      if (order.status === 'EXPIRED' || order.status === 'CANCELLED') {
        return { isPaid: false };
      }

      // Check if order has expired
      if (order.expiresAt && new Date() > order.expiresAt) {
        await this.updatePaymentOrderStatus(orderId, 'EXPIRED');
        return { isPaid: false };
      }

      // Update status to checking
      if (order.status === 'PENDING') {
        await this.updatePaymentOrderStatus(orderId, 'CHECKING');
      }

      // Refresh mutations and search
      const settings = await this.getActiveSettings();
      if (!settings) {
        throw new Error('Moota settings not configured');
      }

      // Refresh mutation first
      try {
        await this.refreshBankMutation(settings.bankAccountId);
      } catch (e) {
        // Ignore refresh errors, continue checking
      }

      // Wait a moment for refresh
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Search for matching mutation
      const mutations = await this.searchMutationByAmount(settings.bankAccountId, order.totalAmount);

      // Find matching credit mutation
      const matchingMutation = mutations.find(m => 
        m.type === 'CR' && 
        m.amount === order.totalAmount &&
        new Date(m.created_at) >= (order.createdAt || new Date(0))
      );

      if (matchingMutation) {
        await this.updatePaymentOrderStatus(orderId, 'PAID', matchingMutation.mutation_id);
        return { isPaid: true, mutation: matchingMutation };
      }

      return { isPaid: false };
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw error;
    }
  }

  // Handle incoming webhook from Moota
  async handleWebhook(
    payload: WebhookPayload[],
    signature: string,
    secretToken: string
  ): Promise<{ processed: string[]; errors: string[] }> {
    const processed: string[] = [];
    const errors: string[] = [];

    // Validate signature (basic validation)
    // In production, implement proper signature validation
    const settings = await this.getActiveSettings();
    if (settings?.secretToken && secretToken !== settings.secretToken) {
      throw new Error('Invalid webhook signature');
    }

    for (const mutation of payload) {
      try {
        // Only process credit mutations
        if (mutation.type !== 'CR') continue;

        // Find matching pending order
        const { data: orders } = await supabase
          .from(this.ORDERS_TABLE)
          .select('*')
          .eq('total_amount', mutation.amount)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true });

        if (orders && orders.length > 0) {
          // Mark the oldest matching order as paid
          await this.updatePaymentOrderStatus(orders[0].order_id, 'PAID', mutation.id);
          processed.push(orders[0].order_id);
        }
      } catch (error) {
        errors.push(`Failed to process mutation ${mutation.id}: ${error}`);
      }
    }

    return { processed, errors };
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  async testConnection(): Promise<{ success: boolean; message: string; bankAccounts?: MootaBankAccount[] }> {
    try {
      const bankAccounts = await this.getBankAccounts();
      return {
        success: true,
        message: `Connection successful! Found ${bankAccounts.length} bank account(s).`,
        bankAccounts
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getBankTypeName(bankType: string): string {
    const bankNames: Record<string, string> = {
      'bca': 'Bank BCA',
      'bni': 'Bank BNI',
      'bri': 'Bank BRI',
      'mandiri': 'Bank Mandiri',
      'bsi': 'Bank Syariah Indonesia',
      'cimb': 'CIMB Niaga',
      'permata': 'Bank Permata',
      'danamon': 'Bank Danamon',
      'gopay': 'GoPay',
      'ovo': 'OVO',
      'dana': 'DANA',
      'shopeepay': 'ShopeePay'
    };
    return bankNames[bankType.toLowerCase()] || bankType.toUpperCase();
  }
}

export default MootaService.getInstance();
