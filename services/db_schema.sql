
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In a real app, this should be hashed. For this migration, we'll keep as-is or migrate blindly.
  role TEXT NOT NULL,
  avatar TEXT,
  specialization TEXT,
  status TEXT DEFAULT 'ACTIVE',
  performance_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  price NUMERIC DEFAULT 0,
  category TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Records Table
CREATE TABLE IF NOT EXISTS service_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  vehicle_model TEXT,
  complaint TEXT,
  diagnosis TEXT,
  ai_diagnosis TEXT,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  finish_time TIMESTAMPTZ,
  status TEXT NOT NULL,
  mechanic_id UUID REFERENCES users(id), -- Assuming mechanic is a user
  weight TEXT,
  parts_used JSONB DEFAULT '[]'::jsonb,
  service_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  payment_method TEXT,
  mechanic_rating NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  license_plate TEXT,
  vehicle_model TEXT,
  booking_date DATE,
  booking_time TIME,
  complaint TEXT,
  audio_base64 TEXT, -- Warning: Storing large base64 strings in DB is not ideal, but simplest for 1:1 migration. Prefer Storage buckets.
  ai_analysis TEXT,
  status TEXT DEFAULT 'PENDING_REVIEW',
  mechanic_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  license_plate TEXT,
  vehicle_model TEXT,
  last_service_date TIMESTAMPTZ,
  next_service_date TIMESTAMPTZ,
  service_type TEXT,
  status TEXT DEFAULT 'PENDING',
  message_template TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional for now, but good practice
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Access for now to match current behavior, strictly need auth later)
CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Update Users" ON users FOR UPDATE USING (true);
CREATE POLICY "Public Insert Users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Users" ON users FOR DELETE USING (true);

CREATE POLICY "Public Read Inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Public Write Inventory" ON inventory FOR ALL USING (true);

CREATE POLICY "Public Read ServiceRecords" ON service_records FOR SELECT USING (true);
CREATE POLICY "Public Write ServiceRecords" ON service_records FOR ALL USING (true);

CREATE POLICY "Public Read Bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Public Write Bookings" ON bookings FOR ALL USING (true);

CREATE POLICY "Public Read Reminders" ON reminders FOR SELECT USING (true);
CREATE POLICY "Public Write Reminders" ON reminders FOR ALL USING (true);

-- RPC Function to execute arbitrary SQL (Only for OWNER)
-- WARNING: This allows full database access. Use with caution.
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  result json;
BEGIN
  -- Check if the user is an OWNER
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  
  IF v_role IS NULL OR v_role <> 'OWNER' THEN
    RAISE EXCEPTION 'Access Denied: Only OWNERS can execute raw SQL.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
  return result;
END;
$$;
