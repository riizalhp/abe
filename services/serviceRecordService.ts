
import { supabase } from '../lib/supabase';
import { ServiceRecord, QueueStatus } from '../types';

export const serviceRecordService = {
    async getQueue(): Promise<ServiceRecord[]> {
        const { data, error } = await supabase
            .from('service_records')
            .select('*')
            .in('status', [QueueStatus.WAITING, QueueStatus.PROCESS, QueueStatus.PENDING])
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Map snake_case to camelCase if DB returns snake_case, but we defined columns as snake_case in SQL 
        // and types as camelCase. Supabase js doesn't auto-convert.
        // We need to map it manually or align types.
        // For this migration, I will assume we need to map.
        return data.map(mapToServiceRecord);
    },

    async getHistory(): Promise<ServiceRecord[]> {
        const { data, error } = await supabase
            .from('service_records')
            .select('*')
            .in('status', [QueueStatus.FINISHED, QueueStatus.PAID, QueueStatus.VOID, QueueStatus.CANCELLED])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapToServiceRecord);
    },

    async create(record: Partial<ServiceRecord>): Promise<ServiceRecord> {
        const dbRecord = mapToDbRecord(record);
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
