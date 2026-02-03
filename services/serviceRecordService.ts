
import { supabase } from '../lib/supabase';
import { ServiceRecord, QueueStatus } from '../types';
import { getStoredWorkshopId } from '../lib/WorkshopContext';

// Status yang dianggap sebagai tiket aktif (belum selesai)
const ACTIVE_STATUSES = [QueueStatus.WAITING, QueueStatus.PROCESS, QueueStatus.PENDING];

export const serviceRecordService = {
    /**
     * Check if a license plate has an active service ticket
     * Returns the active ticket if found, null otherwise
     */
    async checkActiveTicket(licensePlate: string): Promise<ServiceRecord | null> {
        const workshopId = getStoredWorkshopId();
        
        // Normalize license plate (uppercase, remove extra spaces)
        const normalizedPlate = licensePlate.toUpperCase().replace(/\s+/g, ' ').trim();
        
        let query = supabase
            .from('service_records')
            .select('*')
            .ilike('license_plate', normalizedPlate)
            .in('status', ACTIVE_STATUSES)
            .limit(1);
        
        // Filter by workshop_id if user is logged in
        if (workshopId) {
            query = query.eq('workshop_id', workshopId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error checking active ticket:', error);
            return null;
        }

        if (data && data.length > 0) {
            return mapToServiceRecord(data[0]);
        }

        return null;
    },

    async getQueue(): Promise<ServiceRecord[]> {
        const workshopId = getStoredWorkshopId();
        
        let query = supabase
            .from('service_records')
            .select('*')
            .in('status', [QueueStatus.WAITING, QueueStatus.PROCESS, QueueStatus.PENDING])
            .order('created_at', { ascending: true });
        
        // Filter by workshop_id if user is logged in
        if (workshopId) {
            query = query.eq('workshop_id', workshopId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map(mapToServiceRecord);
    },

    async getHistory(): Promise<ServiceRecord[]> {
        const workshopId = getStoredWorkshopId();
        console.log('Fetching service history for workshop:', workshopId);
        
        let query = supabase
            .from('service_records')
            .select('*')
            .in('status', [QueueStatus.FINISHED, QueueStatus.PAID, QueueStatus.VOID, QueueStatus.CANCELLED])
            .order('created_at', { ascending: false });
        
        // Filter by workshop_id if user is logged in
        if (workshopId) {
            query = query.eq('workshop_id', workshopId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Service history query error:', error);
            throw error;
        }
        
        console.log(`Found ${data?.length || 0} history records`);
        return (data || []).map(mapToServiceRecord);
    },

    async create(record: Partial<ServiceRecord>): Promise<ServiceRecord> {
        const workshopId = getStoredWorkshopId();
        
        // Validate: Check for duplicate active ticket with same license plate
        if (record.licensePlate) {
            const activeTicket = await this.checkActiveTicket(record.licensePlate);
            if (activeTicket) {
                throw new Error(
                    `Kendaraan dengan plat ${record.licensePlate} masih memiliki tiket aktif (${activeTicket.ticketNumber}). ` +
                    `Selesaikan tiket tersebut terlebih dahulu sebelum membuat tiket baru.`
                );
            }
        }
        
        const dbRecord = mapToDbRecord(record);
        
        // Always set workshop_id
        if (workshopId) {
            dbRecord.workshop_id = workshopId;
        }
        
        const { data, error } = await supabase
            .from('service_records')
            .insert([dbRecord])
            .select()
            .single();

        if (error) throw error;
        return mapToServiceRecord(data);
    },

    async update(id: string, updates: Partial<ServiceRecord>): Promise<ServiceRecord> {
        const dbUpdates = mapToDbRecord(updates);
        const { data, error } = await supabase
            .from('service_records')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapToServiceRecord(data);
    }
};

const mapToServiceRecord = (data: any): ServiceRecord => ({
    id: data.id,
    ticketNumber: data.ticket_number,
    licensePlate: data.license_plate,
    customerName: data.customer_name,
    phone: data.phone,
    vehicleModel: data.vehicle_model,
    complaint: data.complaint,
    diagnosis: data.diagnosis,
    aiDiagnosis: data.ai_diagnosis,
    entryTime: data.entry_time,
    finishTime: data.finish_time,
    status: data.status as QueueStatus,
    mechanicId: data.mechanic_id,
    weight: data.weight,
    partsUsed: data.parts_used || [], // Ensure array
    serviceCost: data.service_cost,
    totalCost: data.total_cost,
    paymentMethod: data.payment_method,
    mechanicRating: data.mechanic_rating,
    notes: data.notes
});

const mapToDbRecord = (record: Partial<ServiceRecord>): any => {
    const dbRecord: any = {};
    if (record.ticketNumber !== undefined) dbRecord.ticket_number = record.ticketNumber;
    if (record.licensePlate !== undefined) dbRecord.license_plate = record.licensePlate;
    if (record.customerName !== undefined) dbRecord.customer_name = record.customerName;
    if (record.phone !== undefined) dbRecord.phone = record.phone;
    if (record.vehicleModel !== undefined) dbRecord.vehicle_model = record.vehicleModel;
    if (record.complaint !== undefined) dbRecord.complaint = record.complaint;
    if (record.diagnosis !== undefined) dbRecord.diagnosis = record.diagnosis;
    if (record.aiDiagnosis !== undefined) dbRecord.ai_diagnosis = record.aiDiagnosis;
    if (record.entryTime !== undefined) dbRecord.entry_time = record.entryTime;
    if (record.finishTime !== undefined) dbRecord.finish_time = record.finishTime;
    if (record.status !== undefined) dbRecord.status = record.status;
    if (record.mechanicId !== undefined) dbRecord.mechanic_id = record.mechanicId;
    if (record.weight !== undefined) dbRecord.weight = record.weight;
    if (record.partsUsed !== undefined) dbRecord.parts_used = record.partsUsed;
    if (record.serviceCost !== undefined) dbRecord.service_cost = record.serviceCost;
    if (record.totalCost !== undefined) dbRecord.total_cost = record.totalCost;
    if (record.paymentMethod !== undefined) dbRecord.payment_method = record.paymentMethod;
    if (record.mechanicRating !== undefined) dbRecord.mechanic_rating = record.mechanicRating;
    if (record.notes !== undefined) dbRecord.notes = record.notes;
    return dbRecord;
};
