
import { supabase } from '../lib/supabase';
import { BookingRecord, BookingStatus } from '../types';

export const bookingService = {
    async getAll(): Promise<BookingRecord[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapToBookingRecord);
    },

    async create(booking: Partial<BookingRecord>): Promise<BookingRecord> {
        const dbBooking = mapToDbBooking(booking);
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
    createdAt: data.created_at
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
    if (booking.paymentMethod) dbBooking.payment_method = booking.paymentMethod;
    if (booking.transferProofBase64) dbBooking.transfer_proof_base64 = booking.transferProofBase64;
    if (booking.paymentAmount) dbBooking.payment_amount = booking.paymentAmount;
    return dbBooking;
}
