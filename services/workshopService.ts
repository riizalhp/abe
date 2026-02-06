// Workshop Service - Multi-tenant support for ABE.AUTO
import { supabase } from '../lib/supabase';
import { Workshop, User, Role, SubscriptionTier } from '../types';

// ============================================
// Types
// ============================================
export interface WorkshopData {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  description?: string;
  settings?: Record<string, any>;
  payment_method: string;
  is_active: boolean;
  subscription_tier: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkshopInput {
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

export interface WorkshopInvitationData {
  id: string;
  workshop_id: string;
  email: string;
  role: string;
  invite_code: string;
  invited_by?: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

// ============================================
// Helper Functions
// ============================================

// Generate URL-friendly slug from workshop name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Generate unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Convert DB row to Workshop type
function toWorkshop(row: WorkshopData): Workshop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logoUrl: row.logo_url,
    description: row.description,
    settings: row.settings,
    paymentMethod: row.payment_method as any,
    isActive: row.is_active,
    subscriptionTier: row.subscription_tier as SubscriptionTier,
    subscriptionExpiresAt: row.subscription_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Workshop CRUD Operations
// ============================================

// Get workshop by ID
export async function getWorkshopById(workshopId: string): Promise<Workshop | null> {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', workshopId)
    .single();

  if (error || !data) {
    console.error('Error fetching workshop:', error);
    return null;
  }

  return toWorkshop(data);
}

// Get workshop by slug (for guest booking URL)
export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching workshop by slug:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toWorkshop(data);
}

// Get all active workshops (for listing)
export async function getAllActiveWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching workshops:', error);
    return [];
  }

  return (data || []).map(toWorkshop);
}

// Create new workshop with owner
export async function createWorkshop(
  input: CreateWorkshopInput,
  ownerUserId: string
): Promise<{ workshop: Workshop | null; error: string | null }> {
  try {
    // Generate slug if not provided
    let slug = input.slug || generateSlug(input.name);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('workshops')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Append random string to make unique
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // Create workshop
    const { data: workshopData, error: workshopError } = await supabase
      .from('workshops')
      .insert({
        name: input.name,
        slug,
        address: input.address,
        phone: input.phone,
        email: input.email,
        description: input.description,
        is_active: true,
        subscription_tier: 'FREE',
      })
      .select()
      .single();

    if (workshopError || !workshopData) {
      throw new Error(workshopError?.message || 'Failed to create workshop');
    }

    // Update owner's workshop_id and is_owner flag
    const { error: userError } = await supabase
      .from('users')
      .update({
        workshop_id: workshopData.id,
        is_owner: true,
      })
      .eq('id', ownerUserId);

    if (userError) {
      // Rollback: delete the workshop
      await supabase.from('workshops').delete().eq('id', workshopData.id);
      throw new Error('Failed to link workshop to owner');
    }

    return { workshop: toWorkshop(workshopData), error: null };
  } catch (err: any) {
    return { workshop: null, error: err.message };
  }
}

// Update workshop
export async function updateWorkshop(
  workshopId: string,
  updates: Partial<CreateWorkshopInput & { logoUrl?: string; isActive?: boolean; paymentMethod?: string }>
): Promise<{ success: boolean; error: string | null }> {
  const dbUpdates: Record<string, any> = {};

  if (updates.name) dbUpdates.name = updates.name;
  if (updates.slug) {
    // Validate slug uniqueness before updating
    const existingWorkshop = await getWorkshopBySlug(updates.slug);
    if (existingWorkshop && existingWorkshop.id !== workshopId) {
      return { success: false, error: 'Slug sudah digunakan oleh bengkel lain' };
    }
    dbUpdates.slug = updates.slug;
  }
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

  // Use RPC for secure update
  if (updates.name || updates.address || updates.phone || updates.description) {
    const { data, error } = await supabase.rpc('update_workshop_details', {
      p_workshop_id: workshopId,
      p_name: updates.name || null,
      p_address: updates.address || null,
      p_phone: updates.phone || null,
      p_description: updates.description || null
    });

    if (error) {
      console.error('Error updating workshop via RPC:', error);
      return { success: false, error: error.message };
    }

    if (data && !data.success) {
      return { success: false, error: data.error || 'Failed to update workshop' };
    }
  }

  // Separate update for fields not in RPC (like settings, logoUrl, etc.) if needed
  // But for WorkshopSettings form, these are the main fields.
  // Ideally, if we have other fields, we should update them too.

  const additionalUpdates: Record<string, any> = {};
  if (updates.slug) {
    // Validate slug uniqueness before updating
    const existingWorkshop = await getWorkshopBySlug(updates.slug);
    if (existingWorkshop && existingWorkshop.id !== workshopId) {
      return { success: false, error: 'Slug sudah digunakan oleh bengkel lain' };
    }
    additionalUpdates.slug = updates.slug;
  }

  if (updates.logoUrl !== undefined) additionalUpdates.logo_url = updates.logoUrl;
  if (updates.isActive !== undefined) additionalUpdates.is_active = updates.isActive;
  if (updates.paymentMethod !== undefined) additionalUpdates.payment_method = updates.paymentMethod;

  if (Object.keys(additionalUpdates).length > 0) {
    const { error } = await supabase
      .from('workshops')
      .update(additionalUpdates)
      .eq('id', workshopId);

    if (error) {
      console.error('Error updating additional workshop fields:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true, error: null };
}

// ============================================
// Staff Management
// ============================================

// Get all staff for a workshop (optionally filtered by branch)
export async function getWorkshopStaff(workshopId: string, branchId?: string): Promise<User[]> {
  let query = supabase
    .from('users')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('name');

  // Filter by branch if provided
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workshop staff:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role as Role,
    avatar: row.avatar || '',
    specialization: row.specialization,
    status: row.status,
    workshopId: row.workshop_id,
    branchId: row.branch_id,
    isOwner: row.is_owner,
  }));
}

// Create invitation for new staff
export async function createStaffInvitation(
  workshopId: string,
  email: string,
  role: Role,
  invitedBy: string,
  branchId?: string
): Promise<{ inviteCode: string | null; error: string | null }> {
  if (role === Role.OWNER) {
    return { inviteCode: null, error: 'Cannot invite someone as OWNER' };
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const insertData: any = {
    workshop_id: workshopId,
    email,
    role,
    invite_code: inviteCode,
    invited_by: invitedBy,
    expires_at: expiresAt.toISOString(),
  };

  // Include branch_id if provided
  if (branchId) {
    insertData.branch_id = branchId;
  }

  const { error } = await supabase
    .from('workshop_invitations')
    .insert(insertData);

  if (error) {
    console.error('Error creating invitation:', error);
    return { inviteCode: null, error: error.message };
  }

  return { inviteCode, error: null };
}

// Get pending invitations for a workshop (optionally filtered by branch)
export async function getWorkshopInvitations(workshopId: string, branchId?: string): Promise<WorkshopInvitationData[]> {
  let query = supabase
    .from('workshop_invitations')
    .select('*')
    .eq('workshop_id', workshopId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  // Filter by branch if provided
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }

  return data || [];
}

// Accept invitation and join workshop
export async function acceptInvitation(
  inviteCode: string,
  userId: string
): Promise<{ success: boolean; workshopId: string | null; error: string | null }> {
  // Find the invitation
  const { data: invitation, error: findError } = await supabase
    .from('workshop_invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (findError || !invitation) {
    return { success: false, workshopId: null, error: 'Invalid or expired invitation code' };
  }

  // Update user's workshop_id and role
  const { error: updateError } = await supabase
    .from('users')
    .update({
      workshop_id: invitation.workshop_id,
      role: invitation.role,
      is_owner: false,
    })
    .eq('id', userId);

  if (updateError) {
    return { success: false, workshopId: null, error: 'Failed to join workshop' };
  }

  // Mark invitation as accepted
  await supabase
    .from('workshop_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return { success: true, workshopId: invitation.workshop_id, error: null };
}

// Remove staff from workshop
export async function removeStaffFromWorkshop(
  workshopId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  // Check if user is owner - can't remove owner
  const { data: user } = await supabase
    .from('users')
    .select('is_owner')
    .eq('id', userId)
    .single();

  if (user?.is_owner) {
    return { success: false, error: 'Cannot remove workshop owner' };
  }

  // Set workshop_id to null (removes from workshop)
  const { error } = await supabase
    .from('users')
    .update({ workshop_id: null })
    .eq('id', userId)
    .eq('workshop_id', workshopId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Workshop Context (for current session)
// ============================================

let currentWorkshopId: string | null = null;

export function setCurrentWorkshop(workshopId: string | null): void {
  currentWorkshopId = workshopId;
  if (workshopId) {
    localStorage.setItem('currentWorkshopId', workshopId);
  } else {
    localStorage.removeItem('currentWorkshopId');
  }
}

export function getCurrentWorkshopId(): string | null {
  if (!currentWorkshopId) {
    currentWorkshopId = localStorage.getItem('currentWorkshopId');
  }
  return currentWorkshopId;
}

export async function getCurrentWorkshop(): Promise<Workshop | null> {
  // First try from context
  const workshopId = getCurrentWorkshopId();
  if (workshopId) {
    return getWorkshopById(workshopId);
  }

  // Otherwise, get from current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's workshop_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('workshop_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.workshop_id) {
    return null;
  }

  // Cache it and return workshop
  setCurrentWorkshop(userData.workshop_id);
  return getWorkshopById(userData.workshop_id);
}

// ============================================
// Public Workshop Info (for guest booking)
// ============================================

export interface PublicWorkshopInfo {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  description?: string;
  bookingFee: number;
}

export async function getPublicWorkshopInfo(slug: string): Promise<PublicWorkshopInfo | null> {
  const workshop = await getWorkshopBySlug(slug);
  if (!workshop) return null;

  return {
    id: workshop.id,
    name: workshop.name,
    slug: workshop.slug,
    address: workshop.address,
    phone: workshop.phone,
    logoUrl: workshop.logoUrl,
    description: workshop.description,
    bookingFee: workshop.settings?.booking_fee || 25000,
  };
}

// ============================================
// Moota Settings per Workshop
// ============================================

export async function getWorkshopMootaSettings(workshopId: string, branchId?: string) {
  // Moota is now centrally configured - always return hardcoded settings
  // No need to check database anymore
  try {
    const mootaService = (await import('./mootaService')).default;
    const hardcodedSettings = await mootaService.getHardcodedSettings();

    if (hardcodedSettings) {
      console.log('[getWorkshopMootaSettings] Using hardcoded Moota settings');
      return {
        id: 'hardcoded',
        workshop_id: workshopId,
        branch_id: branchId || null,
        access_token: hardcodedSettings.accessToken,
        bank_account_id: hardcodedSettings.bankAccountId,
        bank_account_name: hardcodedSettings.bankAccountName,
        account_number: hardcodedSettings.accountNumber,
        bank_type: hardcodedSettings.bankType,
        unique_code_start: hardcodedSettings.uniqueCodeStart,
        unique_code_end: hardcodedSettings.uniqueCodeEnd,
        is_active: true
      };
    }

    console.log('[getWorkshopMootaSettings] No hardcoded Moota settings available');
    return null;
  } catch (error) {
    console.error('[getWorkshopMootaSettings] Error getting hardcoded settings:', error);
    return null;
  }
}

// ============================================
// Branch lookup by code
// ============================================

export interface BranchInfo {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export async function getBranchByCode(workshopId: string, code: string): Promise<BranchInfo | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching branch by code:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    address: data.address,
    phone: data.phone,
  };
}

// ============================================
// Time Slots per Workshop
// ============================================

export interface WorkshopTimeSlot {
  id: string;
  workshopId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxBookings: number;
  isActive: boolean;
}

export async function getWorkshopTimeSlots(workshopId: string, branchId?: string): Promise<WorkshopTimeSlot[]> {
  // Note: branch_id column may not exist in time_slots table yet
  // So we just filter by workshop_id for now
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  if (error) {
    console.error('Error fetching time slots:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    workshopId: row.workshop_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    maxBookings: row.max_bookings,
    isActive: row.is_active,
  }));
}

export async function createTimeSlot(
  workshopId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  maxBookings: number = 5
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('time_slots')
    .insert({
      workshop_id: workshopId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      max_bookings: maxBookings,
      is_active: true,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Workshop Settings Management
// ============================================

// Get workshop settings (returns merged settings with defaults)
export async function getWorkshopSettings(workshopId: string): Promise<Record<string, any>> {
  console.log('[getWorkshopSettings] Fetching settings for workshop:', workshopId);

  const { data, error } = await supabase
    .from('workshops')
    .select('settings')
    .eq('id', workshopId)
    .single();

  if (error || !data) {
    console.error('[getWorkshopSettings] Error fetching workshop settings:', error);
    return { booking_fee: 25000 }; // Default values
  }

  console.log('[getWorkshopSettings] Raw settings from DB:', data.settings);

  // Return settings with default values for missing fields
  const result = {
    booking_fee: 25000,
    ...data.settings,
  };

  console.log('[getWorkshopSettings] Merged settings:', result);
  return result;
}

// Update workshop settings (partial update)
export async function updateWorkshopSettings(
  workshopId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  console.log('[updateWorkshopSettings] Updating settings for workshop:', workshopId, 'with:', updates);

  try {
    // First get current settings
    const { data: currentData, error: fetchError } = await supabase
      .from('workshops')
      .select('settings')
      .eq('id', workshopId)
      .single();

    if (fetchError) {
      console.error('[updateWorkshopSettings] Error fetching current settings:', fetchError);
      return { success: false, error: 'Gagal mengambil pengaturan saat ini' };
    }

    const currentSettings = currentData?.settings || {};

    // Merge with updates
    const newSettings = {
      ...currentSettings,
      ...updates,
    };

    console.log('[updateWorkshopSettings] New settings payload:', newSettings);

    // Update in database
    const { error: updateError } = await supabase
      .from('workshops')
      .update({ settings: newSettings })
      .eq('id', workshopId);

    if (updateError) {
      console.error('[updateWorkshopSettings] Error updating workshop settings:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[updateWorkshopSettings] Exception:', err);
    return { success: false, error: err.message || 'Failed to update settings' };
  }
}

// Get booking fee for a workshop or specific branch
export async function getBookingFee(workshopId: string, branchId?: string | null): Promise<number> {
  console.log('[getBookingFee] Getting booking fee for workshop:', workshopId, 'branch:', branchId);

  // If branchId provided, try generic branch settings first
  if (branchId) {
    const { data: branchData, error } = await supabase
      .from('branches')
      .select('settings')
      .eq('id', branchId)
      .single();

    console.log('[getBookingFee] Raw branch data from DB:', branchData);

    let settings = branchData?.settings;

    // Robust parsing: Handle if settings is a string (common Supabase gotcha)
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
        console.log('[getBookingFee] Parsed string settings:', settings);
      } catch (e) {
        console.error('[getBookingFee] Failed to parse settings string:', e);
        settings = {};
      }
    }

    // Ensure settings is an object
    settings = settings || {};

    console.log('[getBookingFee] Final settings object:', settings);

    // Check if booking_fee exists (can be 0, so check undefined)
    if (settings.booking_fee !== undefined && settings.booking_fee !== null) {
      const fee = Number(settings.booking_fee);
      console.log('[getBookingFee] Returning branch-specific fee:', fee);
      return fee;
    } else {
      console.log('[getBookingFee] Branch settings found but booking_fee missing/null. Falling back to global.');
    }
  }

  // Fallback to workshop global settings
  const settings = await getWorkshopSettings(workshopId);
  const fee = settings.booking_fee || 25000;
  console.log('[getBookingFee] Returning global workshop fee:', fee);
  return fee;
}

// Update booking fee for a workshop or branch
export async function updateBookingFee(
  workshopId: string,
  amount: number,
  branchId?: string | null
): Promise<{ success: boolean; error: string | null }> {
  console.log('[updateBookingFee] Updating fee to', amount, 'for workshop:', workshopId, 'branch:', branchId);

  try {
    if (branchId) {
      // Update branch settings
      const { data: currentBranch } = await supabase
        .from('branches')
        .select('settings')
        .eq('id', branchId)
        .single();

      let currentSettings = currentBranch?.settings;

      // Robust parsing
      if (typeof currentSettings === 'string') {
        try {
          currentSettings = JSON.parse(currentSettings);
        } catch (e) {
          currentSettings = {};
        }
      }

      currentSettings = currentSettings || {};

      const newSettings = { ...currentSettings, booking_fee: amount };
      console.log('[updateBookingFee] Saving new settings for branch:', newSettings);

      // Get User ID from localStorage (Custom Auth Compatibility)
      const savedUser = localStorage.getItem('currentUser');
      let userId: string | undefined;
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          userId = u.id;
        } catch (e) { }
      }

      if (userId) {
        // Use RPC with explicit user_id to bypass RLS
        const { data: updateResult, error } = await supabase.rpc('update_branch_settings', {
          p_branch_id: branchId,
          p_settings: newSettings,
          p_user_id: userId
        });

        console.log('[updateBookingFee] RPC Result:', updateResult, 'Error:', error);

        if (error) {
          console.error('[updateBookingFee] RPC failed:', error);
          throw error;
        }
      } else {
        console.warn('[updateBookingFee] No user ID found locally. Direct update fallback.');
        const { error } = await supabase
          .from('branches')
          .update({ settings: newSettings })
          .eq('id', branchId);
        if (error) throw error;
      }

      return { success: true, error: null };
    } else {
      // Update global workshop settings
      return updateWorkshopSettings(workshopId, { booking_fee: amount });
    }
  } catch (error: any) {
    console.error('Error updating booking fee:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Export default service object
// ============================================

const workshopService = {
  // Workshop CRUD
  getWorkshopById,
  getWorkshopBySlug,
  getAllActiveWorkshops,
  createWorkshop,
  updateWorkshop,

  // Staff Management
  getWorkshopStaff,
  createStaffInvitation,
  getWorkshopInvitations,
  acceptInvitation,
  removeStaffFromWorkshop,

  // Context
  setCurrentWorkshop,
  getCurrentWorkshopId,
  getCurrentWorkshop,

  // Public
  getPublicWorkshopInfo,

  // Branch
  getBranchByCode,

  // Moota
  getWorkshopMootaSettings,

  // Time Slots
  getWorkshopTimeSlots,
  createTimeSlot,

  // Settings
  getWorkshopSettings,
  updateWorkshopSettings,
  getBookingFee,
  updateBookingFee,
};

export default workshopService;
