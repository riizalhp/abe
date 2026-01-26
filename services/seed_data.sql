-- Seed Data for ABE Auto Management System

-- 1. Additional Users (Mechanic & Cashier)
-- Ensure 'admin' exists (already created by user), adding checking to avoid duplicates if re-run partially
INSERT INTO users (name, username, password, role, status, performance_score, specialization)
VALUES 
('Budi Mekanik', 'budi', '123', 'MEKANIK', 'ACTIVE', 4.8, 'Engine Specialist'),
('Siti Kasir', 'siti', '123', 'KASIR', 'ACTIVE', 5.0, NULL)
ON CONFLICT (username) DO NOTHING;

-- 2. Inventory Items
INSERT INTO inventory (name, stock, min_stock, price, category, unit)
VALUES 
('Oli MPX 2 (0.8L)', 24, 10, 55000, 'Oil', 'Bottle'),
('Kampas Rem Depan Vario', 15, 5, 85000, 'Brake', 'Set'),
('Busi NGK', 50, 20, 25000, 'Ignition', 'Pcs'),
('Filter Udara Beat FI', 8, 5, 65000, 'Filter', 'Pcs'),
('Ban Tubeless 90/90-14', 12, 4, 280000, 'Tire', 'Pcs');

-- 3. Service Records (Active Queue)
INSERT INTO service_records (ticket_number, license_plate, customer_name, phone, vehicle_model, complaint, status, entry_time)
VALUES 
('A-00001', 'B 1234 XYZ', 'Pak Ahmad', '08123456789', 'Honda Vario 150', 'Ganti Oli + Service Rutin', 'PROCESS', NOW() - INTERVAL '30 minutes'),
('A-00002', 'B 5678 ABC', 'Ibu Rina', '08198765432', 'Yamaha NMAX', 'Rem bunyi cit cit', 'WAITING', NOW() - INTERVAL '10 minutes');

-- 4. Service Records (History)
INSERT INTO service_records (ticket_number, license_plate, customer_name, phone, vehicle_model, complaint, diagnosis, status, service_cost, total_cost, finish_time, entry_time)
VALUES 
('A-00000', 'D 4321 EF', 'Andi', '08129988776', 'Honda Beat', 'Mogok gak bisa starter', 'Aki soak', 'FINISHED', 35000, 285000, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day 2 hours');

-- 5. Bookings
INSERT INTO bookings (booking_code, customer_name, phone, license_plate, vehicle_model, booking_date, booking_time, complaint, status)
VALUES 
('BK-9988', 'Doni', '08133344455', 'B 9999 GH', 'Yamaha Aerox', CURRENT_DATE + INTERVAL '1 day', '10:00', 'Service CVT', 'PENDING');

-- 6. Reminders
INSERT INTO reminders (customer_name, phone, license_plate, vehicle_model, last_service_date, next_service_date, service_type, status)
VALUES 
('Pak Eko', '0811223344', 'AB 1234 CD', 'Supra X 125', NOW() - INTERVAL '3 months', NOW() + INTERVAL '2 days', 'Ganti Oli', 'PENDING');
