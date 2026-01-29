-- Migration: Add QRIS settings table
-- Run this in Supabase SQL Editor

-- Create QRIS settings table
CREATE TABLE IF NOT EXISTS qris_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_name TEXT NOT NULL,
    qris_string TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_qris_settings_is_default ON qris_settings (is_default);

-- Enable Row Level Security
ALTER TABLE qris_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON qris_settings FOR
SELECT TO authenticated USING (true);

-- Policy: Allow insert/update/delete for authenticated users (you may want to restrict this to admins)
CREATE POLICY "Allow write access to authenticated users" ON qris_settings FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- Create Time Slot settings table
CREATE TABLE IF NOT EXISTS time_slot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    day_of_week INTEGER NOT NULL CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    ),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (day_of_week, start_time)
);

-- Create index for time slot queries
CREATE INDEX IF NOT EXISTS idx_time_slot_day ON time_slot_settings (day_of_week);

CREATE INDEX IF NOT EXISTS idx_time_slot_active ON time_slot_settings (is_active);

-- Enable Row Level Security for time slots
ALTER TABLE time_slot_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (including guests for booking)
CREATE POLICY "Allow read access to everyone" ON time_slot_settings FOR
SELECT USING (true);

-- Policy: Allow write access to authenticated users
CREATE POLICY "Allow write access to authenticated users" ON time_slot_settings FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- Insert default time slots (Monday to Saturday, 8 AM to 5 PM, 2-hour slots)
INSERT INTO
    time_slot_settings (
        day_of_week,
        start_time,
        end_time,
        max_bookings,
        is_active
    )
VALUES
    -- Monday (1)
    (1, '08:00', '10:00', 3, true),
    (1, '10:00', '12:00', 3, true),
    (1, '13:00', '15:00', 3, true),
    (1, '15:00', '17:00', 3, true),
    -- Tuesday (2)
    (2, '08:00', '10:00', 3, true),
    (2, '10:00', '12:00', 3, true),
    (2, '13:00', '15:00', 3, true),
    (2, '15:00', '17:00', 3, true),
    -- Wednesday (3)
    (3, '08:00', '10:00', 3, true),
    (3, '10:00', '12:00', 3, true),
    (3, '13:00', '15:00', 3, true),
    (3, '15:00', '17:00', 3, true),
    -- Thursday (4)
    (4, '08:00', '10:00', 3, true),
    (4, '10:00', '12:00', 3, true),
    (4, '13:00', '15:00', 3, true),
    (4, '15:00', '17:00', 3, true),
    -- Friday (5)
    (5, '08:00', '10:00', 3, true),
    (5, '10:00', '12:00', 3, true),
    (5, '13:00', '15:00', 3, true),
    (5, '15:00', '17:00', 3, true),
    -- Saturday (6)
    (6, '08:00', '10:00', 3, true),
    (6, '10:00', '12:00', 3, true),
    (6, '13:00', '15:00', 3, true) ON CONFLICT (day_of_week, start_time) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for qris_settings
DROP TRIGGER IF EXISTS update_qris_settings_updated_at ON qris_settings;

CREATE TRIGGER update_qris_settings_updated_at
    BEFORE UPDATE ON qris_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for time_slot_settings
DROP TRIGGER IF EXISTS update_time_slot_settings_updated_at ON time_slot_settings;

CREATE TRIGGER update_time_slot_settings_updated_at
    BEFORE UPDATE ON time_slot_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();