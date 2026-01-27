
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';

export const userService = {
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;
        return data as User[];
    },

    async create(user: Partial<User>): Promise<User> {
        // Validate required fields
        if (!user.name || !user.username || !user.role) {
            throw new Error('Missing required fields: name, username, or role');
        }

        console.log('Attempting to insert user:', user);
        const { data, error } = await supabase
            .from('users')
            .insert([user])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
        }
        
        console.log('User inserted successfully:', data);
        return data as User;
    },

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

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
