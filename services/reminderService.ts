
import { supabase } from '../lib/supabase';
import { ServiceReminder, ReminderStatus } from '../types';
import { getStoredWorkshopId } from '../lib/WorkshopContext';
import { getStoredBranchId } from '../lib/BranchContext';

export const reminderService = {
    async getAll(): Promise<ServiceReminder[]> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();
        
        let query = supabase
            .from('reminders')
            .select('*')
            .order('next_service_date', { ascending: true });
        
        // Filter by workshop_id if user is logged in
        if (workshopId) {
            query = query.eq('workshop_id', workshopId);
        }
        
        // Try with branch_id filter, fallback without it if column doesn't exist
        try {
            if (branchId) {
                const { data, error } = await query.eq('branch_id', branchId);
                if (error) {
                    // If branch_id column doesn't exist, retry without it
                    if (error.message.includes('branch_id does not exist')) {
                        console.warn('branch_id column not found in reminders table, fetching without branch filter');
                        const { data: fallbackData, error: fallbackError } = await supabase
                            .from('reminders')
                            .select('*')
                            .eq('workshop_id', workshopId || '')
                            .order('next_service_date', { ascending: true });
                        if (fallbackError) throw fallbackError;
                        return (fallbackData || []).map(mapToReminder);
                    }
                    throw error;
                }
                return (data || []).map(mapToReminder);
            }
        } catch (e: any) {
            if (e.message?.includes('branch_id does not exist')) {
                console.warn('branch_id column not found, fetching all reminders for workshop');
            } else {
                throw e;
            }
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(mapToReminder);
    },

    async create(reminder: Partial<ServiceReminder>): Promise<ServiceReminder> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();
        const dbReminder = mapToDbReminder(reminder);
        
        // Always set workshop_id
        if (workshopId) {
            dbReminder.workshop_id = workshopId;
        }
        // Only set branch_id if it exists (will be ignored if column doesn't exist)
        if (branchId) {
            dbReminder.branch_id = branchId;
        }
        
        const { data, error } = await supabase
            .from('reminders')
            .insert([dbReminder])
            .select()
            .single();

        if (error) throw error;
        return mapToReminder(data);
    },

    async update(id: string, updates: Partial<ServiceReminder>): Promise<ServiceReminder> {
        const dbUpdates = mapToDbReminder(updates);
        const { data, error } = await supabase
            .from('reminders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapToReminder(data);
    }
};

const mapToReminder = (data: any): ServiceReminder => ({
    id: data.id,
    customerName: data.customer_name,
    phone: data.phone,
    licensePlate: data.license_plate,
    vehicleModel: data.vehicle_model,
    lastServiceDate: data.last_service_date,
    nextServiceDate: data.next_service_date,
    serviceType: data.service_type,
    status: data.status as ReminderStatus,
    messageTemplate: data.message_template,
    sentAt: data.sent_at
});

const mapToDbReminder = (reminder: Partial<ServiceReminder>): any => {
    const dbReminder: any = {};
    if (reminder.customerName) dbReminder.customer_name = reminder.customerName;
    if (reminder.phone) dbReminder.phone = reminder.phone;
    if (reminder.licensePlate) dbReminder.license_plate = reminder.licensePlate;
    if (reminder.vehicleModel) dbReminder.vehicle_model = reminder.vehicleModel;
    if (reminder.lastServiceDate) dbReminder.last_service_date = reminder.lastServiceDate;
    if (reminder.nextServiceDate) dbReminder.next_service_date = reminder.nextServiceDate;
    if (reminder.serviceType) dbReminder.service_type = reminder.serviceType;
    if (reminder.status) dbReminder.status = reminder.status;
    if (reminder.messageTemplate) dbReminder.message_template = reminder.messageTemplate;
    if (reminder.sentAt) dbReminder.sent_at = reminder.sentAt;
    return dbReminder;
}
