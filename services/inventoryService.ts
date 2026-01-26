
import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

export const inventoryService = {
    async getAll(): Promise<InventoryItem[]> {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as InventoryItem[];
    },

    async create(item: Partial<InventoryItem>): Promise<InventoryItem> {
        const { data, error } = await supabase
            .from('inventory')
            .insert([item])
            .select()
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
        // Map 'stock' to database column if needed, but assuming same name
        const { data, error } = await supabase
            .from('inventory')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateStock(id: string, qtyChange: number): Promise<void> {
        // This is better done with an RPC call for atomicity, but for now fetch-update is simpler migration
        const { data: item, error: fetchError } = await supabase
            .from('inventory')
            .select('stock')
            .eq('id', id)
            .single();

        if (fetchError || !item) throw fetchError;

        const newStock = item.stock + qtyChange;
        const { error: updateError } = await supabase
            .from('inventory')
            .update({ stock: newStock })
            .eq('id', id);

        if (updateError) throw updateError;
    }
};
