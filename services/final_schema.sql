-- FINAL COMPLETE SCHEMA for ABE.AUTO
-- Run this in Supabase SQL Editor to set up the entire backend.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Stored as plain text for this demo (production should use hashing)
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEKANIK', 'KASIR')),
    avatar TEXT,
    specialization TEXT,
    performance_score NUMERIC DEFAULT 5.0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    price NUMERIC DEFAULT 0,
    category TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CHECKED_IN')),
    mechanic_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REMINDERS (CRM)
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT,
    license_plate TEXT,
    vehicle_model TEXT,
    last_service_date TIMESTAMP WITH TIME ZONE,
    next_service_date TIMESTAMP WITH TIME ZONE,
    service_type TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'Confirmed', 'Missed')),
    message_template TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
