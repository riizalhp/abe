
import { supabase } from '../lib/supabase';
import { BookingRecord, BookingStatus } from '../types';
import { getStoredWorkshopId } from '../lib/WorkshopContext';
import { getStoredBranchId } from '../lib/BranchContext';

export const bookingService = {
    async getAll(): Promise<BookingRecord[]> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();

        let query = supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

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
        return (data || []).map(mapToBookingRecord);
    },

    async create(booking: Partial<BookingRecord>): Promise<BookingRecord> {
        const workshopId = getStoredWorkshopId();
        const branchId = getStoredBranchId();
        const dbBooking = mapToDbBooking(booking);

        // Set workshop_id if logged in, or use provided workshopId
        if (workshopId) {
            dbBooking.workshop_id = workshopId;
        } else if (booking.workshopId) {
            dbBooking.workshop_id = booking.workshopId;
        }

        // Set branch_id - prioritize provided branchId from URL, then stored branchId
        if ((booking as any).branchId) {
            dbBooking.branch_id = (booking as any).branchId;
        } else if (branchId) {
            dbBooking.branch_id = branchId;
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([dbBooking])
            .select()
            .single();

        if (error) throw error;
        return mapToBookingRecord(data);
    },

    async updateStatus(id: string, status: BookingStatus, aiAnalysis?: string): Promise<BookingRecord> {
        const updates: any = { status };
        if (aiAnalysis) updates.ai_analysis = aiAnalysis;

        const { data, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapToBookingRecord(data);
    }
};

const mapToBookingRecord = (data: any): BookingRecord => ({
    id: data.id,
    bookingCode: data.booking_code,
    customerName: data.customer_name,
    phone: data.phone,
    licensePlate: data.license_plate,
    vehicleModel: data.vehicle_model,
    bookingDate: data.booking_date,
    bookingTime: data.booking_time,
    complaint: data.complaint,
    audioBase64: data.audio_base64,
    aiAnalysis: data.ai_analysis,
    status: data.status as BookingStatus,
    mechanicId: data.mechanic_id,
    paymentMethod: data.payment_method,
    transferProofBase64: data.transfer_proof_base64,
    paymentAmount: data.payment_amount,
    createdAt: data.created_at,
    workshopId: data.workshop_id,
    workshopSlug: data.workshop_slug
});

const mapToDbBooking = (booking: Partial<BookingRecord>): any => {
    const dbBooking: any = {};
    if (booking.bookingCode) dbBooking.booking_code = booking.bookingCode;
    if (booking.customerName) dbBooking.customer_name = booking.customerName;
    if (booking.phone) dbBooking.phone = booking.phone;
    if (booking.licensePlate) dbBooking.license_plate = booking.licensePlate;
    if (booking.vehicleModel) dbBooking.vehicle_model = booking.vehicleModel;
    if (booking.bookingDate) dbBooking.booking_date = booking.bookingDate;
    if (booking.bookingTime) dbBooking.booking_time = booking.bookingTime;
    if (booking.complaint) dbBooking.complaint = booking.complaint;
    if (booking.audioBase64) dbBooking.audio_base64 = booking.audioBase64;
    if (booking.aiAnalysis) dbBooking.ai_analysis = booking.aiAnalysis;
    if (booking.status) dbBooking.status = booking.status;
    if (booking.mechanicId) dbBooking.mechanic_id = booking.mechanicId;
    // Columns that don't exist in bookings table - skip them:
    // - payment_method (stored in payment_orders)
    // - payment_amount (stored in payment_orders)
    if (booking.transferProofBase64) dbBooking.transfer_proof_base64 = booking.transferProofBase64;
    // - transfer_proof_base64 (not used with Moota) - UPDATE: Used for QRIS/Manual
    if (booking.workshopId) dbBooking.workshop_id = booking.workshopId;
    return dbBooking;
}
