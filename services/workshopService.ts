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
    .single();

  if (error || !data) {
    console.error('Error fetching workshop by slug:', error);
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
  updates: Partial<CreateWorkshopInput & { logoUrl?: string; isActive?: boolean }>
): Promise<{ success: boolean; error: string | null }> {
  const dbUpdates: Record<string, any> = {};
  
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { error } = await supabase
    .from('workshops')
    .update(dbUpdates)
    .eq('id', workshopId);

  if (error) {
    console.error('Error updating workshop:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Staff Management
// ============================================

// Get all staff for a workshop
export async function getWorkshopStaff(workshopId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('name');

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
    isOwner: row.is_owner,
  }));
}

// Create invitation for new staff
export async function createStaffInvitation(
  workshopId: string,
  email: string,
  role: Role,
  invitedBy: string
): Promise<{ inviteCode: string | null; error: string | null }> {
  if (role === Role.OWNER) {
    return { inviteCode: null, error: 'Cannot invite someone as OWNER' };
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const { error } = await supabase
    .from('workshop_invitations')
    .insert({
      workshop_id: workshopId,
      email,
      role,
      invite_code: inviteCode,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('Error creating invitation:', error);
    return { inviteCode: null, error: error.message };
  }

  return { inviteCode, error: null };
}

// Get pending invitations for a workshop
export async function getWorkshopInvitations(workshopId: string): Promise<WorkshopInvitationData[]> {
  const { data, error } = await supabase
    .from('workshop_invitations')
    .select('*')
    .eq('workshop_id', workshopId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

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
  };
}

// ============================================
// Moota Settings per Workshop
// ============================================

export async function getWorkshopMootaSettings(workshopId: string) {
  const { data, error } = await supabase
    .from('moota_settings')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
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

export async function getWorkshopTimeSlots(workshopId: string): Promise<WorkshopTimeSlot[]> {
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

  // Moota
  getWorkshopMootaSettings,

  // Time Slots
  getWorkshopTimeSlots,
  createTimeSlot,
};

export default workshopService;
