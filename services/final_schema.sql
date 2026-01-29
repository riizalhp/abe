-- FINAL COMPLETE SCHEMA for ABE.AUTO
-- Run this in Supabase SQL Editor to set up the entire backend.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Stored as plain text for this demo (production should use hashing)
    role TEXT NOT NULL CHECK (
        role IN (
            'OWNER',
            'ADMIN',
            'MEKANIK',
            'KASIR'
        )
    ),
    avatar TEXT,
    specialization TEXT,
    performance_score NUMERIC DEFAULT 5.0,
    status TEXT DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'INACTIVE')
    ),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 3. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    price NUMERIC DEFAULT 0,
    category TEXT,
    unit TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 4. SERVICE RECORDS (Queue & History)
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    vehicle_model TEXT,
    complaint TEXT,
    diagnosis TEXT,
    ai_diagnosis TEXT,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finish_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'PROCESS', 'PENDING', 'FINISHED', 'PAID', 'VOID', 'CANCELLED')),
    mechanic_id TEXT, -- References users(id) but kept loose for demo simplicity or if using external IDs
    weight TEXT, -- 'LIGHT', 'MEDIUM', 'HEAVY'
    parts_used JSONB DEFAULT '[]'::jsonb,
    service_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    payment_method TEXT,
    mechanic_rating NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BOOKINGS (Online Appointments)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    booking_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    license_plate TEXT,
    vehicle_model TEXT,
    booking_date TEXT, -- YYYY-MM-DD
    booking_time TEXT, -- HH:mm
    complaint TEXT,
    audio_base64 TEXT, -- Recommend using Storage for production, kept here for prototype speed
    ai_analysis TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'CONFIRMED',
            'REJECTED',
            'CHECKED_IN'
        )
    ),
    mechanic_id TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 6. REMINDERS (CRM)
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    customer_name TEXT NOT NULL,
    phone TEXT,
    license_plate TEXT,
    vehicle_model TEXT,
    last_service_date TIMESTAMP
    WITH
        TIME ZONE,
        next_service_date TIMESTAMP
    WITH
        TIME ZONE,
        service_type TEXT,
        status TEXT DEFAULT 'PENDING' CHECK (
            status IN (
                'PENDING',
                'SENT',
                'Confirmed',
                'Missed'
            )
        ),
        message_template TEXT,
        sent_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- 7. SQL EDITOR FUNCTION (RPC)
-- Allows the OWNER to run raw SQL queries from the frontend
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
  RETURN result;
END;
$$;

-- 8. STOCK LOGS TABLE (Audit Trail for Inventory)
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    inventory_id UUID REFERENCES inventory (id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (
        change_type IN (
            'IN',
            'OUT',
            'ADJUSTMENT',
            'SALE',
            'RETURN'
        )
    ),
    reference_type TEXT CHECK (
        reference_type IN (
            'SERVICE',
            'MANUAL',
            'PURCHASE',
            'RETURN'
        )
    ),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on stock_logs
CREATE INDEX IF NOT EXISTS idx_stock_logs_inventory ON stock_logs (inventory_id);

CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_logs_change_type ON stock_logs (change_type);

-- 9. ENABLE ROW-LEVEL SECURITY (RLS) AND POLICIES
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Policies for USERS table
CREATE POLICY select_users ON users FOR
SELECT USING (
        role = 'OWNER'
        OR role = 'ADMIN'
    );

CREATE POLICY insert_users ON users FOR
INSERT
WITH
    CHECK (role = 'OWNER');

CREATE POLICY update_users ON users FOR
UPDATE USING (role = 'OWNER')
WITH
    CHECK (role = 'OWNER');

CREATE POLICY delete_users ON users FOR DELETE USING (role = 'OWNER');

-- Policies for INVENTORY table
CREATE POLICY select_inventory ON inventory FOR SELECT USING (true);

CREATE POLICY insert_inventory ON inventory FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY update_inventory ON inventory FOR UPDATE USING (true);

CREATE POLICY delete_inventory ON inventory FOR DELETE USING (true);

-- Policies for SERVICE_RECORDS table
CREATE POLICY select_service_records ON service_records FOR
SELECT USING (true);

CREATE POLICY insert_service_records ON service_records FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY update_service_records ON service_records FOR
UPDATE USING (true);

CREATE POLICY delete_service_records ON service_records FOR DELETE USING (true);

-- Policies for BOOKINGS table
CREATE POLICY select_bookings ON bookings FOR SELECT USING (true);

CREATE POLICY insert_bookings ON bookings FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY update_bookings ON bookings FOR UPDATE USING (true);

CREATE POLICY delete_bookings ON bookings FOR DELETE USING (true);

-- Policies for REMINDERS table
CREATE POLICY select_reminders ON reminders FOR SELECT USING (true);

CREATE POLICY insert_reminders ON reminders FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY update_reminders ON reminders FOR UPDATE USING (true);

CREATE POLICY delete_reminders ON reminders FOR DELETE USING (true);

-- Policies for STOCK_LOGS table
CREATE POLICY select_stock_logs ON stock_logs FOR
SELECT USING (true);

CREATE POLICY insert_stock_logs ON stock_logs FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY update_stock_logs ON stock_logs FOR
UPDATE USING (true);

CREATE POLICY delete_stock_logs ON stock_logs FOR DELETE USING (true);