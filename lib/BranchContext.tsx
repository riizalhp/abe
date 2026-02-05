// Branch Context - Multi-Cabang/Branch Isolation untuk ABE
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { getStoredWorkshopId } from './WorkshopContext';

// ============================================
// Types
// ============================================
export interface Branch {
  id: string;
  workshopId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
}

interface BranchContextType {
  // Branch data
  branches: Branch[];
  activeBranch: Branch | null;

  // State
  isLoading: boolean;

  // Actions
  changeBranch: (branch: Branch) => void;
  refreshBranches: () => Promise<void>;
  addBranch: (data: Omit<Branch, 'id' | 'workshopId' | 'createdAt'>) => Promise<{ success: boolean; error?: string; branch?: Branch }>;
}

// ============================================
// Context
// ============================================
const BranchContext = createContext<BranchContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================
interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load branches for current workshop
  const loadBranches = async () => {
    // Custom Auth: Trust localStorage for now since we're fixing the auth system separately
    // const { data: { user } } = await supabase.auth.getUser();

    // Fallback: Get user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    let userId: string | undefined;

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        userId = parsedUser.id;
      } catch (e) {
        console.error('Failed to parse currentUser from localStorage');
      }
    }

    if (!userId) {
      setBranches([]);
      setActiveBranch(null);
      setIsLoading(false);
      return;
    }

    // Get the REAL workshop_id from the user's profile
    const { data: userData } = await supabase
      .from('users')
      .select('workshop_id')
      .eq('id', userId)
      .single();

    const verifiedWorkshopId = userData?.workshop_id;
    const storedWorkshopId = getStoredWorkshopId();

    // If stored ID doesn't match verified ID, force use of verified ID
    // This fixes the "Drakor vs Joko" cross-tenant leak
    const workshopId = verifiedWorkshopId || storedWorkshopId;

    if (!workshopId) {
      setIsLoading(false);
      return;
    }

    // If we had a mismatch, correct the local storage
    if (verifiedWorkshopId && storedWorkshopId !== verifiedWorkshopId) {
      console.warn('[BranchContext] Security Mismatch! Fixup: LocalStorage ID was', storedWorkshopId, 'but User belongs to', verifiedWorkshopId);
      localStorage.setItem('currentWorkshopId', verifiedWorkshopId);
    }

    console.log('[BranchContext] Loading branches for Workshop ID:', workshopId);

    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('is_active', true)
        .order('is_main', { ascending: false })
        .order('name', { ascending: true });

      console.log('[BranchContext] Load result:', { count: data?.length, error });

      if (error) {
        console.error('Failed to load branches:', error);
        setIsLoading(false);
        return;
      }

      // ... rest of processing

      const branchList: Branch[] = (data || []).map((b: any) => ({
        id: b.id,
        workshopId: b.workshop_id,
        name: b.name,
        code: b.code,
        address: b.address,
        phone: b.phone,
        isMain: b.is_main,
        isActive: b.is_active,
        createdAt: b.created_at,
      }));

      setBranches(branchList);

      // Restore active branch from localStorage or use main branch
      const savedBranchId = localStorage.getItem('activeBranchId');
      let activeB = branchList.find(b => b.id === savedBranchId);

      if (!activeB) {
        // Default to main branch or first branch
        activeB = branchList.find(b => b.isMain) || branchList[0];
      }

      if (activeB) {
        setActiveBranch(activeB);
        localStorage.setItem('activeBranchId', activeB.id);
      }
    } catch (e) {
      console.error('Error loading branches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Change active branch
  const changeBranch = useCallback((branch: Branch) => {
    setActiveBranch(branch);
    localStorage.setItem('activeBranchId', branch.id);
    // Trigger page refresh to reload data with new branch
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: branch }));
  }, []);

  // Refresh branches
  const refreshBranches = useCallback(async () => {
    await loadBranches();
  }, []);

  // Add new branch
  const addBranch = async (data: Omit<Branch, 'id' | 'workshopId' | 'createdAt'>): Promise<{ success: boolean; error?: string; branch?: Branch }> => {
    // SECURITY FIX: Don't trust localStorage. Get verified workshop ID.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User tidak terautentikasi' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('workshop_id')
      .eq('id', user.id)
      .single();

    const workshopId = userData?.workshop_id;

    if (!workshopId) {
      return { success: false, error: 'Workshop tidak ditemukan untuk user ini' };
    }

    try {
      // Generate branch code if not provided
      const code = data.code || generateBranchCode(data.name);

      const { data: newBranch, error } = await supabase
        .from('branches')
        .insert({
          workshop_id: workshopId, // Use verified ID
          name: data.name,
          code: code,
          address: data.address,
          phone: data.phone,
          is_main: data.isMain || false,
          is_active: data.isActive !== false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add branch:', error);
        return { success: false, error: error.message };
      }

      const branch: Branch = {
        id: newBranch.id,
        workshopId: newBranch.workshop_id,
        name: newBranch.name,
        code: newBranch.code,
        address: newBranch.address,
        phone: newBranch.phone,
        isMain: newBranch.is_main,
        isActive: newBranch.is_active,
        createdAt: newBranch.created_at,
      };

      // Refresh branch list
      await refreshBranches();

      return { success: true, branch };
    } catch (e: any) {
      console.error('Error adding branch:', e);
      return { success: false, error: e.message || 'Gagal menambah cabang' };
    }
  };

  const value: BranchContextType = {
    branches,
    activeBranch,
    isLoading,
    changeBranch,
    refreshBranches,
    addBranch,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

// ============================================
// Hook
// ============================================
export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

// ============================================
// Helper Functions
// ============================================

// Generate branch code from name
function generateBranchCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 5) + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
}

// Get stored branch ID for services
export function getStoredBranchId(): string | null {
  try {
    return localStorage.getItem('activeBranchId') || null;
  } catch (e) {
    console.error('Failed to get branch ID:', e);
  }
  return null;
}
