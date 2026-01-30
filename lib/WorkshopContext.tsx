// Workshop Context - Provides workshop data throughout the app
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { User, Workshop, Role } from '../types';

// ============================================
// Types
// ============================================
interface WorkshopContextType {
  // Current user & workshop
  currentUser: User | null;
  currentWorkshop: Workshop | null;
  workshopId: string | null;
  
  // Auth state
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshWorkshop: () => Promise<void>;
}

// ============================================
// Context
// ============================================
const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================
interface WorkshopProviderProps {
  children: ReactNode;
}

export function WorkshopProvider({ children }: WorkshopProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentWorkshop, setCurrentWorkshop] = useState<Workshop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const workshopId = currentUser?.workshopId || null;
  const isAuthenticated = !!currentUser;
  const isOwner = currentUser?.isOwner || currentUser?.role === Role.OWNER;

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (user.workshopId) {
          loadWorkshop(user.workshopId);
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Load workshop data
  const loadWorkshop = async (workshopId: string) => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('id', workshopId)
        .single();

      if (error) {
        console.error('Failed to load workshop:', error);
        return;
      }

      if (data) {
        setCurrentWorkshop({
          id: data.id,
          name: data.name,
          slug: data.slug,
          address: data.address,
          phone: data.phone,
          email: data.email,
          logoUrl: data.logo_url,
          description: data.description,
          settings: data.settings,
          isActive: data.is_active,
          subscriptionTier: data.subscription_tier,
          subscriptionExpiresAt: data.subscription_expires_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (e) {
      console.error('Error loading workshop:', e);
    }
  };

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Query user by username and password
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password', password)
        .single();

      if (error || !users) {
        return { success: false, error: 'Username atau password salah' };
      }

      const user: User = {
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        role: users.role as Role,
        avatar: users.avatar || '',
        specialization: users.specialization,
        status: users.status,
        workshopId: users.workshop_id,
        isOwner: users.is_owner,
      };

      // Save to state and localStorage
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Load workshop if user has one
      if (user.workshopId) {
        await loadWorkshop(user.workshopId);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: e.message || 'Gagal login' };
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setCurrentWorkshop(null);
    localStorage.removeItem('currentUser');
  };

  // Refresh workshop data
  const refreshWorkshop = useCallback(async () => {
    if (workshopId) {
      await loadWorkshop(workshopId);
    }
  }, [workshopId]);

  const value: WorkshopContextType = {
    currentUser,
    currentWorkshop,
    workshopId,
    isLoading,
    isAuthenticated,
    isOwner,
    login,
    logout,
    refreshWorkshop,
  };

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

// ============================================
// Hook
// ============================================
export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (context === undefined) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
}

// ============================================
// Helper to get workshop ID for services
// ============================================
export function getStoredWorkshopId(): string | null {
  try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user.workshopId || null;
    }
  } catch (e) {
    console.error('Failed to get workshop ID:', e);
  }
  return null;
}
