-- Test Data Generator for ABE System
-- Run this in Supabase SQL Editor to populate test data

-- Insert sample users
INSERT INTO
    users (
        name,
        username,
        password,
        role,
        specialization,
        status,
        performance_score
    )
VALUES (
        'Admin Test',
        'admin',
        '123',
        'ADMIN',
        'General Management',
        'ACTIVE',
        NULL
    ),
    (
        'Budi Mekanik',
        'budi',
        '123',
        'MEKANIK',
        'Engine Specialist',
        'ACTIVE',
        4.8
    ),
    (
        'Sari Kasir',
        'sari',
        '123',
        'KASIR',
        'Customer Service',
        'ACTIVE',
        NULL
    ),
    (
        'Joko Mekanik',
        'joko',
        '123',
        'MEKANIK',
        'Transmission Expert',
        'ACTIVE',
        4.5
    ) ON CONFLICT (username) DO NOTHING;

-- Insert sample inventory items
INSERT INTO
    inventory (
        name,
        stock,
        min_stock,
        price,
        category,
        unit
    )
VALUES (
        'Oli Mesin 10W-40',
        50,
        10,
        75000,
        'Lubricants',
        'Liter'
    ),
    (
        'Filter Oli',
        25,
        5,
        45000,
        'Filters',
        'Pcs'
    ),
    (
        'Busi NGK',
        30,
        8,
        35000,
        'Engine Parts',
        'Pcs'
    ),
    (
        'Ban Dalam Motor',
        15,
        3,
        25000,
        'Tires',
        'Pcs'
    ),
    (
        'V-Belt',
        20,
        5,
        85000,
        'Transmission',
        'Pcs'
    ),
    (
        'Kampas Rem',
        12,
        4,
        65000,
        'Braking',
        'Set'
    ),
    (
        'Aki Motor 12V',
        8,
        2,
        250000,
        'Electrical',
        'Pcs'
    ),
    (
        'Kabel Gas',
        18,
        6,
        45000,
        'Control Parts',
        'Pcs'
    ) ON CONFLICT DO NOTHING;

-- Insert sample completed service records for history testing
INSERT INTO
    service_records (
        ticket_number,
        license_plate,
        customer_name,
        phone,
        vehicle_model,
        complaint,
        diagnosis,
        entry_time,
        finish_time,
        status,
        mechanic_id,
        weight,
        service_cost,
        total_cost,
        payment_method,
        mechanic_rating
    )
VALUES (
        'TKT-001',
        'B 1234 ABC',
        'Andi Sutanto',
        '081234567890',
        'Honda Beat 2020',
        'Mesin brebet dan susah hidup',
        'Ganti busi dan pembersihan karburator',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
        'FINISHED',
        (
            SELECT id
            FROM users
            WHERE
                role = 'MEKANIK'
            LIMIT 1
        ),
        'LIGHT',
        150000,
        175000,
        'CASH',
        5.0
    ),
    (
        'TKT-002',
        'B 5678 DEF',
        'Sinta Dewi',
        '081234567891',
        'Yamaha Vixion 2019',
        'Rem blong dan bunyi mencit',
        'Ganti kampas rem depan belakang',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days' + INTERVAL '1.5 hours',
        'PAID',
        (
            SELECT id
            FROM users
            WHERE
                role = 'MEKANIK'
            LIMIT 1
        ),
        'MEDIUM',
        200000,
        265000,
        'TRANSFER',
        4.8
    ),
    (
        'TKT-003',
        'B 9999 GHI',
        'Bambang Prakoso',
        '081234567892',
        'Suzuki Satria 2018',
        'Rantai kendor dan ganti oli',
        'Service rutin + stel rantai',
        NOW() - INTERVAL '1 week',
        NOW() - INTERVAL '1 week' + INTERVAL '45 minutes',
        'FINISHED',
        (
            SELECT id
            FROM users
            WHERE
                role = 'MEKANIK'
            OFFSET
                1
            LIMIT 1
        ),
        'LIGHT',
        120000,
        195000,
        'CASH',
        4.5
    ),
    (
        'TKT-004',
        'B 7777 JKL',
        'Rita Maharani',
        '081234567893',
        'Honda Scoopy 2021',
        'Lampu depan mati dan klakson tidak bunyi',
        'Ganti bohlam dan relay klakson',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days' + INTERVAL '30 minutes',
        'PAID',
        (
            SELECT id
            FROM users
            WHERE
                role = 'MEKANIK'
            LIMIT 1
        ),
        'LIGHT',
        80000,
        125000,
        'CASH',
        5.0
    ),
    (
        'TKT-005',
        'B 3333 MNO',
        'Dedi Kurniawan',
        '081234567894',
        'Kawasaki Ninja 250 2020',
        'Engine overheat dan perlu tune up',
        'Ganti radiator dan full service',
        NOW() - INTERVAL '2 weeks',
        NOW() - INTERVAL '2 weeks' + INTERVAL '4 hours',
        'FINISHED',
        (
            SELECT id
            FROM users
            WHERE
                role = 'MEKANIK'
            OFFSET
                1
            LIMIT 1
        ),
        'HEAVY',
        850000,
        1200000,
        'TRANSFER',
        4.9
    ) ON CONFLICT DO NOTHING;

-- Insert sample current queue items
INSERT INTO
    service_records (
        ticket_number,
        license_plate,
        customer_name,
        phone,
        vehicle_model,
        complaint,
        entry_time,
        status,
        weight
    )
VALUES (
        'TKT-Q01',
        'B 1111 PQR',
        'Agus Setiawan',
        '081234567895',
        'Honda Vario 2022',
        'Ganti oli dan cek rem',
        NOW(),
        'WAITING',
        'LIGHT'
    ),
    (
        'TKT-Q02',
        'B 2222 STU',
        'Maya Sari',
        '081234567896',
        'Yamaha Aerox 2021',
        'Mesin ngelitik dan rantai bunyi',
        NOW() + INTERVAL '15 minutes',
        'WAITING',
        'MEDIUM'
    ),
    (
        'TKT-Q03',
        'B 4444 VWX',
        'Indra Wijaya',
        '081234567897',
        'Suzuki GSX 2020',
        'Service berkala 10.000 KM',
        NOW() + INTERVAL '30 minutes',
        'PROCESS',
        'MEDIUM'
    ) ON CONFLICT DO NOTHING;

-- Insert sample booking

INSERT INTO bookings (
    booking_code, customer_name, phone, license_plate, vehicle_model,
    booking_date, booking_time, complaint, status
) VALUES
('BK-001', 'Tono Susanto', '081234567898', 'B 6666 YZA', 'Honda CBR 150 2019',
 (CURRENT_DATE + INTERVAL '1 day')::text, '09:00', 'Ganti ban dan cek suspensi', 'CONFIRMED'),
 
('BK-002', 'Lina Kartika', '081234567899', 'B 8888 BCD', 'Yamaha Mio 2020',
 (CURRENT_DATE + INTERVAL '2 days')::text, '14:00', 'Service rutin dan cek aki', 'PENDING')
ON CONFLICT DO NOTHING;

-- Verify data inserted
SELECT 'Users' as table_name, COUNT(*) as count
FROM users
UNION ALL
SELECT 'Inventory', COUNT(*)
FROM inventory
UNION ALL
SELECT 'Service Records', COUNT(*)
FROM service_records
UNION ALL
SELECT 'Bookings', COUNT(*)
FROM bookings;