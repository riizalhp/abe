import { supabase } from '../lib/supabase';
import { User, Role } from '../types';
import { getStoredBranchId } from '../lib/BranchContext';
import { getStoredWorkshopId } from '../lib/WorkshopContext';

export interface CreateStaffData {
  name: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  specialization?: string;
}

export const staffService = {
  /**
   * Create a new staff member with Supabase Auth + profile
   */
  async createWithAuth(data: CreateStaffData): Promise<User> {
    // Validate required fields
    if (!data.name || !data.username || !data.email || !data.password || !data.role) {
      throw new Error('Missing required fields: name, username, email, password, or role');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .single();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Step 1: Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          username: data.username
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw new Error(`Failed to create auth account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user - no user returned');
    }

    // Step 2: Insert profile into users table
    const profileData = {
      id: authData.user.id, // Use same ID from auth
      name: data.name,
      username: data.username,
      password: data.password, // Still stored for legacy login support
      role: data.role,
      avatar: data.avatar || '',
      specialization: data.specialization || null,
      status: 'ACTIVE'
    };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      // Rollback: delete auth user if profile creation fails
      // Note: This requires admin privileges in production
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log('Staff created successfully with auth:', profile);
    return profile as User;
  },

  /**
   * Create staff without auth (legacy method - for backwards compatibility)
   */
  async createWithoutAuth(user: Partial<User>): Promise<User> {
    if (!user.name || !user.username || !user.role) {
      throw new Error('Missing required fields: name, username, or role');
    }

    const branchId = getStoredBranchId();
    const workshopId = getStoredWorkshopId();
    
    const insertData: any = {
      ...user,
      status: user.status || 'ACTIVE'
    };
    
    if (branchId) {
      insertData.branch_id = branchId;
    }
    if (workshopId) {
      insertData.workshop_id = workshopId;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('User insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data as User;
  },

  /**
   * Get all staff members
   */
  async getAll(): Promise<User[]> {
    const branchId = getStoredBranchId();
    
    let query = supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as User[];
  },

  /**
   * Get staff by role
   */
  async getByRole(role: Role): Promise<User[]> {
    const branchId = getStoredBranchId();
    
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('name');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as User[];
  },

  /**
   * Update staff member
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  /**
   * Deactivate staff (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ status: 'INACTIVE' })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Hard delete staff member
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Authenticate user (for login)
   */
  async authenticate(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  },

  /**
   * Login with Supabase Auth (email/password)
   */
  async loginWithAuth(email: string, password: string): Promise<{ user: User; session: any } | null> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      console.error('Auth login error:', authError);
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    return {
      user: profile as User,
      session: authData.session
    };
  },

  /**
   * Logout from Supabase Auth
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  /**
   * Get current authenticated session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
};
