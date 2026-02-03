
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';
import { getStoredWorkshopId } from '../lib/WorkshopContext';
import { getStoredBranchId } from '../lib/BranchContext';

export const userService = {
    async getAll(): Promise<User[]> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();
        
        let query = supabase.from('users').select('*');
        
        // Filter by workshop_id if user is logged in
        if (workshopId) {
            query = query.eq('workshop_id', workshopId);
        }
        
        // Filter by branch_id if branch is selected
        if (branchId) {
            query = query.eq('branch_id', branchId);
        }
        
        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(mapToUser);
    },

    async create(user: Partial<User>): Promise<User> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();
        
        // Validate required fields
        if (!user.name || !user.username || !user.role) {
            throw new Error('Missing required fields: name, username, or role');
        }

        const dbUser = {
            name: user.name,
            username: user.username,
            password: user.password || '123',
            email: user.email,
            role: user.role,
            avatar: user.avatar || '',
            specialization: user.specialization,
            status: user.status || 'ACTIVE',
            workshop_id: workshopId, // Always set workshop_id
            branch_id: branchId, // Set branch_id
            is_owner: user.isOwner || false,
        };

        console.log('Attempting to insert user:', dbUser);
        const { data, error } = await supabase
            .from('users')
            .insert([dbUser])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
        }
        
        console.log('User inserted successfully:', data);
        return mapToUser(data);
    },

    async update(id: string, updates: Partial<User>): Promise<User> {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.avatar) dbUpdates.avatar = updates.avatar;
        if (updates.specialization) dbUpdates.specialization = updates.specialization;
        if (updates.status) dbUpdates.status = updates.status;
        
        const { data, error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapToUser(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Map database row to User type
const mapToUser = (data: any): User => ({
    id: data.id,
    name: data.name,
    username: data.username,
    password: data.password,
    email: data.email,
    role: data.role as Role,
    avatar: data.avatar || '',
    specialization: data.specialization,
    status: data.status,
    workshopId: data.workshop_id,
    isOwner: data.is_owner,
});
