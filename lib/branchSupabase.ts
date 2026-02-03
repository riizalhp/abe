// Branch Supabase Wrapper - Otomatis filter query berdasarkan branch_id
// Gunakan wrapper ini untuk query yang harus isolated per cabang

import { supabase } from './supabase';
import { getStoredBranchId } from './BranchContext';

/**
 * Supabase wrapper yang otomatis menambahkan filter branch_id
 * 
 * Usage:
 * const db = branchSupabase();
 * const { data } = await db.from('products').select('*');
 * // Otomatis di-filter berdasarkan branch aktif
 */
export const branchSupabase = (branchId?: string) => {
  const activeBranchId = branchId || getStoredBranchId();

  return {
    from(table: string) {
      const base = supabase.from(table);

      return {
        /**
         * SELECT dengan otomatis filter branch_id
         */
        select: (query = '*') => {
          const q = base.select(query);
          if (activeBranchId) {
            return q.eq('branch_id', activeBranchId);
          }
          return q;
        },

        /**
         * INSERT dengan otomatis menambahkan branch_id
         */
        insert: (payload: any | any[]) => {
          if (!activeBranchId) {
            return base.insert(payload);
          }

          const withBranch = Array.isArray(payload)
            ? payload.map(p => ({ ...p, branch_id: activeBranchId }))
            : { ...payload, branch_id: activeBranchId };

          return base.insert(withBranch);
        },

        /**
         * UPDATE dengan otomatis filter branch_id
         */
        update: (payload: any) => {
          const q = base.update(payload);
          if (activeBranchId) {
            return q.eq('branch_id', activeBranchId);
          }
          return q;
        },

        /**
         * DELETE dengan otomatis filter branch_id
         */
        delete: () => {
          const q = base.delete();
          if (activeBranchId) {
            return q.eq('branch_id', activeBranchId);
          }
          return q;
        },

        /**
         * UPSERT dengan otomatis menambahkan branch_id
         */
        upsert: (payload: any | any[], options?: { onConflict?: string }) => {
          if (!activeBranchId) {
            return base.upsert(payload, options);
          }

          const withBranch = Array.isArray(payload)
            ? payload.map(p => ({ ...p, branch_id: activeBranchId }))
            : { ...payload, branch_id: activeBranchId };

          return base.upsert(withBranch, options);
        },
      };
    },
  };
};

/**
 * Hook-style wrapper untuk digunakan dalam component
 * 
 * Usage dalam component:
 * const { activeBranch } = useBranch();
 * const db = useBranchSupabase(activeBranch?.id);
 */
export const useBranchSupabase = (branchId?: string) => {
  return branchSupabase(branchId);
};

export default branchSupabase;
