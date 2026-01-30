// Registration Service - Handles workshop owner registration without Supabase Auth
import { supabase } from '../lib/supabase';
import { Role } from '../types';

// ============================================
// Types
// ============================================
export interface RegistrationInput {
  // Owner data
  ownerName: string;
  username: string;
  password: string;
  
  // Workshop data
  workshopName: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface RegistrationResult {
  success: boolean;
  workshopSlug?: string;
  workshopName?: string;
  error?: string;
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

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// Registration Function
// ============================================
export async function registerWorkshopOwner(input: RegistrationInput): Promise<RegistrationResult> {
  try {
    // 1. Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', input.username.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking username:', checkError);
      return { success: false, error: 'Gagal memeriksa username' };
    }

    if (existingUser) {
      return { success: false, error: 'Username sudah digunakan' };
    }

    // 2. Generate slug for workshop
    let slug = generateSlug(input.workshopName);
    
    // Check if slug exists
    const { data: existingWorkshop } = await supabase
      .from('workshops')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingWorkshop) {
      // Append random string to make unique
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // 3. Generate user ID
    const userId = generateUUID();

    // 4. Create workshop first (using RPC to bypass RLS)
    const { data: workshopData, error: workshopError } = await supabase
      .rpc('create_workshop_with_owner', {
        p_user_id: userId,
        p_user_name: input.ownerName,
        p_username: input.username.toLowerCase(),
        p_password: input.password,
        p_workshop_name: input.workshopName,
        p_workshop_slug: slug,
        p_phone: input.phone || null,
        p_address: input.address || null,
        p_description: input.description || null,
      });

    if (workshopError) {
      console.error('Error creating workshop with owner:', workshopError);
      
      // Fallback: try direct insert if RPC doesn't exist
      if (workshopError.message.includes('function') || workshopError.code === '42883') {
        return await fallbackRegistration(input, userId, slug);
      }
      
      return { success: false, error: workshopError.message };
    }

    return {
      success: true,
      workshopSlug: slug,
      workshopName: input.workshopName,
    };

  } catch (err: any) {
    console.error('Registration error:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan saat registrasi' };
  }
}

// Fallback registration using direct inserts (for when RPC doesn't exist)
async function fallbackRegistration(
  input: RegistrationInput,
  userId: string,
  slug: string
): Promise<RegistrationResult> {
  try {
    // 1. Insert workshop directly
    const { data: workshop, error: workshopInsertError } = await supabase
      .from('workshops')
      .insert({
        name: input.workshopName,
        slug: slug,
        phone: input.phone,
        address: input.address,
        description: input.description,
        is_active: true,
        subscription_tier: 'FREE',
      })
      .select()
      .single();

    if (workshopInsertError) {
      console.error('Workshop insert error:', workshopInsertError);
      return { success: false, error: `Gagal membuat workshop: ${workshopInsertError.message}` };
    }

    // 2. Insert user with workshop_id
    const { error: userInsertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: input.ownerName,
        username: input.username.toLowerCase(),
        password: input.password,
        role: Role.OWNER,
        is_owner: true,
        status: 'ACTIVE',
        workshop_id: workshop.id,
      });

    if (userInsertError) {
      console.error('User insert error:', userInsertError);
      // Rollback: delete workshop
      await supabase.from('workshops').delete().eq('id', workshop.id);
      return { success: false, error: `Gagal membuat user: ${userInsertError.message}` };
    }

    return {
      success: true,
      workshopSlug: slug,
      workshopName: input.workshopName,
    };

  } catch (err: any) {
    console.error('Fallback registration error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// Check Username Availability
// ============================================
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return !data;
}
