-- ============================================
-- MULTI-TENANT MIGRATION FOR ABE.AUTO
-- Supports multiple workshops with their own owners, staff, and data
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WORKSHOPS TABLE (Main tenant table)
-- ============================================
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier e.g., "abe-auto-jakarta"
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb, -- Workshop-specific settings
    is_active BOOLEAN DEFAULT true,
    subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for workshops
CREATE INDEX IF NOT EXISTS idx_workshops_slug ON workshops (slug);

CREATE INDEX IF NOT EXISTS idx_workshops_is_active ON workshops (is_active);

-- ============================================
-- 2. ADD workshop_id TO USERS TABLE
-- ============================================
-- First add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'workshop_id') THEN
        ALTER TABLE users ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE
        table_name = 'users'
        AND column_name = 'email'
) THEN
ALTER TABLE users
ADD COLUMN email TEXT;

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE
        table_name = 'users'
        AND column_name = 'is_owner'
) THEN
ALTER TABLE users
ADD COLUMN is_owner BOOLEAN DEFAULT false;

END IF;

END $$;

-- Create index for users.workshop_id
CREATE INDEX IF NOT EXISTS idx_users_workshop_id ON users (workshop_id);

-- ============================================
-- 3. ADD workshop_id TO INVENTORY TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory' AND column_name = 'workshop_id') THEN
        ALTER TABLE inventory ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_workshop_id ON inventory (workshop_id);

-- ============================================
-- 4. ADD workshop_id TO SERVICE_RECORDS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_records' AND column_name = 'workshop_id') THEN
        ALTER TABLE service_records ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_service_records_workshop_id ON service_records (workshop_id);

-- ============================================
-- 5. ADD workshop_id TO BOOKINGS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'workshop_id') THEN
        ALTER TABLE bookings ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_workshop_id ON bookings (workshop_id);

-- ============================================
-- 6. ADD workshop_id TO REMINDERS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reminders' AND column_name = 'workshop_id') THEN
        ALTER TABLE reminders ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_reminders_workshop_id ON reminders (workshop_id);

-- ============================================
-- 7. ADD workshop_id TO STOCK_LOGS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_logs' AND column_name = 'workshop_id') THEN
        ALTER TABLE stock_logs ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_stock_logs_workshop_id ON stock_logs (workshop_id);

-- ============================================
-- 8. ADD workshop_id TO MOOTA_SETTINGS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'moota_settings' AND column_name = 'workshop_id') THEN
        ALTER TABLE moota_settings ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_moota_settings_workshop_id ON moota_settings (workshop_id);

-- ============================================
-- 9. ADD workshop_id TO PAYMENT_ORDERS TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_orders' AND column_name = 'workshop_id') THEN
        ALTER TABLE payment_orders ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;

END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_payment_orders_workshop_id ON payment_orders (workshop_id);

-- ============================================
-- 10. TIME_SLOTS TABLE (per workshop)
-- ============================================
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    workshop_id UUID NOT NULL REFERENCES workshops (id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        workshop_id,
        day_of_week,
        start_time
    )
);

CREATE INDEX IF NOT EXISTS idx_time_slots_workshop_id ON time_slots (workshop_id);

CREATE INDEX IF NOT EXISTS idx_time_slots_day_of_week ON time_slots (day_of_week);

-- ============================================
-- 11. WORKSHOP INVITATIONS TABLE
-- For inviting staff to join a workshop
-- ============================================
CREATE TABLE IF NOT EXISTS workshop_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    workshop_id UUID NOT NULL REFERENCES workshops (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('ADMIN', 'MEKANIK', 'KASIR')
    ),
    invite_code TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES users (id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT(NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workshop_invitations_code ON workshop_invitations (invite_code);

CREATE INDEX IF NOT EXISTS idx_workshop_invitations_email ON workshop_invitations (email);

-- ============================================
-- 12. UPDATE TRIGGERS
-- ============================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Workshops trigger
DROP TRIGGER IF EXISTS update_workshops_updated_at ON workshops;

CREATE TRIGGER update_workshops_updated_at
    BEFORE UPDATE ON workshops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Time slots trigger
DROP TRIGGER IF EXISTS update_time_slots_updated_at ON time_slots;

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. ENABLE RLS FOR NEW TABLES
-- ============================================
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

ALTER TABLE workshop_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. RLS POLICIES FOR WORKSHOPS
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their workshop" ON workshops;

DROP POLICY IF EXISTS "Owners can manage their workshop" ON workshops;

DROP POLICY IF EXISTS "Public can view active workshops" ON workshops;

DROP POLICY IF EXISTS "Authenticated users can create workshop" ON workshops;

DROP POLICY IF EXISTS "Owners can update their workshop" ON workshops;

DROP POLICY IF EXISTS "Owners can delete their workshop" ON workshops;

DROP POLICY IF EXISTS "Anon can create workshop" ON workshops;

-- Public can view active workshops (for guest booking)
CREATE POLICY "Public can view active workshops" ON workshops FOR
SELECT USING (is_active = true);

-- Authenticated users can view their own workshop
CREATE POLICY "Users can view their workshop" ON workshops FOR
SELECT TO authenticated USING (
        id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- Allow anonymous users to create workshop (for registration without Supabase Auth)
CREATE POLICY "Anon can create workshop" ON workshops FOR
INSERT
    TO anon
WITH
    CHECK (true);

-- Authenticated users can create new workshop (for registration)
CREATE POLICY "Authenticated users can create workshop" ON workshops FOR
INSERT
    TO authenticated
WITH
    CHECK (true);

-- Owners can update and delete their workshop
CREATE POLICY "Owners can update their workshop" ON workshops FOR
UPDATE TO authenticated USING (
    id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
            AND is_owner = true
    )
)
WITH
    CHECK (
        id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
                AND is_owner = true
        )
    );

CREATE POLICY "Owners can delete their workshop" ON workshops FOR DELETE TO authenticated USING (
    id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
            AND is_owner = true
    )
);

-- ============================================
-- 15. RLS POLICIES FOR TIME_SLOTS
-- ============================================
DROP POLICY IF EXISTS "Public can view time slots" ON time_slots;

DROP POLICY IF EXISTS "Workshop staff can manage time slots" ON time_slots;

CREATE POLICY "Public can view time slots" ON time_slots FOR
SELECT USING (is_active = true);

CREATE POLICY "Workshop staff can manage time slots" ON time_slots FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- ============================================
-- 16. RLS POLICIES FOR INVITATIONS
-- ============================================
DROP POLICY IF EXISTS "Owners can manage invitations" ON workshop_invitations;

DROP POLICY IF EXISTS "Users can view their invitations" ON workshop_invitations;

CREATE POLICY "Owners can manage invitations" ON workshop_invitations FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
            AND (
                is_owner = true
                OR role = 'ADMIN'
            )
    )
);

-- Users can view invitations for their workshop
CREATE POLICY "Users can view their invitations" ON workshop_invitations FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- ============================================
-- 17. UPDATE EXISTING TABLE POLICIES FOR MULTI-TENANCY
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view workshop members" ON users;

DROP POLICY IF EXISTS "Owners can manage workshop users" ON users;

DROP POLICY IF EXISTS "Users can insert own record" ON users;

DROP POLICY IF EXISTS "Users can update own record" ON users;

DROP POLICY IF EXISTS "Anon can create user" ON users;

DROP POLICY IF EXISTS "Anon can check username" ON users;

-- Allow anonymous to check if username exists (for registration)
CREATE POLICY "Anon can check username" ON users FOR
SELECT TO anon USING (true);

-- Allow anonymous users to create user (for registration without Supabase Auth)
CREATE POLICY "Anon can create user" ON users FOR
INSERT
    TO anon
WITH
    CHECK (true);

-- Users can insert their own record (for registration with Supabase Auth)
CREATE POLICY "Users can insert own record" ON users FOR
INSERT
    TO authenticated
WITH
    CHECK (id = auth.uid ());

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users FOR
UPDATE TO authenticated USING (id = auth.uid ());

-- Users can view workshop members
CREATE POLICY "Users can view workshop members" ON users FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users u
            WHERE
                u.id = auth.uid ()
        )
        OR id = auth.uid ()
    );

-- Owners can manage workshop users
CREATE POLICY "Owners can manage workshop users" ON users FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users u
        WHERE
            u.id = auth.uid ()
            AND (
                u.is_owner = true
                OR u.role = 'ADMIN'
            )
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND (
                    u.is_owner = true
                    OR u.role = 'ADMIN'
                )
        )
    );

-- Bookings table policies (allow public insert for guest booking)
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

DROP POLICY IF EXISTS "Workshop staff can view bookings" ON bookings;

DROP POLICY IF EXISTS "Workshop staff can manage bookings" ON bookings;

DROP POLICY IF EXISTS "Public can view own booking" ON bookings;
-- Ensure this policy is dropped before creating it

CREATE POLICY "Public can create bookings" ON bookings FOR
INSERT
    TO anon
WITH
    CHECK (true);

CREATE POLICY "Public can view own booking" ON bookings FOR
SELECT TO anon USING (true);
-- They need booking_code to find it

CREATE POLICY "Workshop staff can view bookings" ON bookings FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Workshop staff can manage bookings" ON bookings FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- Service Records policies
DROP POLICY IF EXISTS "Workshop staff can view service records" ON service_records;

DROP POLICY IF EXISTS "Workshop staff can manage service records" ON service_records;

CREATE POLICY "Workshop staff can view service records" ON service_records FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Workshop staff can manage service records" ON service_records FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- Inventory policies
DROP POLICY IF EXISTS "Workshop staff can view inventory" ON inventory;

DROP POLICY IF EXISTS "Workshop staff can manage inventory" ON inventory;

CREATE POLICY "Workshop staff can view inventory" ON inventory FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Workshop staff can manage inventory" ON inventory FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- Reminders policies
DROP POLICY IF EXISTS "Workshop staff can view reminders" ON reminders;

DROP POLICY IF EXISTS "Workshop staff can manage reminders" ON reminders;

CREATE POLICY "Workshop staff can view reminders" ON reminders FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Workshop staff can manage reminders" ON reminders FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- Moota Settings policies
DROP POLICY IF EXISTS "Workshop owner can manage moota settings" ON moota_settings;

DROP POLICY IF EXISTS "Workshop staff can view moota settings" ON moota_settings;

CREATE POLICY "Workshop staff can view moota settings" ON moota_settings FOR
SELECT TO authenticated USING (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Workshop owner can manage moota settings" ON moota_settings FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
            AND (
                is_owner = true
                OR role IN ('OWNER', 'ADMIN')
            )
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
                AND (
                    is_owner = true
                    OR role IN ('OWNER', 'ADMIN')
                )
        )
    );

-- Payment Orders policies (allow public view for guest tracking)
DROP POLICY IF EXISTS "Public can view payment orders" ON payment_orders;

DROP POLICY IF EXISTS "Workshop staff can manage payment orders" ON payment_orders;

DROP POLICY IF EXISTS "Public can create payment orders" ON payment_orders;
-- Ensure this policy is dropped before creating it

CREATE POLICY "Public can view payment orders" ON payment_orders FOR
SELECT TO anon USING (true);

CREATE POLICY "Public can create payment orders" ON payment_orders FOR
INSERT
    TO anon
WITH
    CHECK (true);

CREATE POLICY "Workshop staff can manage payment orders" ON payment_orders FOR ALL TO authenticated USING (
    workshop_id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        workshop_id IN (
            SELECT workshop_id
            FROM users
            WHERE
                id = auth.uid ()
        )
    );

-- ============================================
-- 18. HELPER FUNCTIONS
-- ============================================

-- Function to get current user's workshop_id
CREATE OR REPLACE FUNCTION get_current_workshop_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT workshop_id FROM users WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is workshop owner
CREATE OR REPLACE FUNCTION is_workshop_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT is_owner FROM users WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workshop by slug (for guest booking)
CREATE OR REPLACE FUNCTION get_workshop_by_slug(workshop_slug TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.name, w.slug, w.address, w.phone, w.logo_url, w.description
    FROM workshops w
    WHERE w.slug = workshop_slug AND w.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 19. CREATE DEFAULT WORKSHOP FOR EXISTING DATA
-- ============================================
DO $$
DECLARE
    default_workshop_id UUID;
BEGIN
    -- Check if default workshop exists
    SELECT id INTO default_workshop_id FROM workshops WHERE slug = 'default-workshop' LIMIT 1;
    
    -- Create default workshop if not exists
    IF default_workshop_id IS NULL THEN
        INSERT INTO workshops (name, slug, description)
        VALUES ('Default Workshop', 'default-workshop', 'Default workshop for migrated data')
        RETURNING id INTO default_workshop_id;
    END IF;
    
    -- Update all existing records without workshop_id
    UPDATE users SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    UPDATE inventory SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    UPDATE service_records SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    UPDATE bookings SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    UPDATE reminders SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    
    -- Update moota tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'moota_settings') THEN
        UPDATE moota_settings SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_orders') THEN
        UPDATE payment_orders SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_logs') THEN
        UPDATE stock_logs SET workshop_id = default_workshop_id WHERE workshop_id IS NULL;
    END IF;
    
    -- Set first OWNER as is_owner for the default workshop
    WITH cte AS (
        SELECT id
        FROM users
        WHERE role = 'OWNER' AND workshop_id = default_workshop_id AND is_owner IS NOT true
        LIMIT 1
    )
    UPDATE users
    SET is_owner = true
    WHERE id IN (SELECT id FROM cte);
END $$;

-- ============================================
-- 20. VIEWS FOR MULTI-TENANT DATA
-- ============================================

-- View for workshop dashboard stats
CREATE OR REPLACE VIEW workshop_stats AS
SELECT
    w.id as workshop_id,
    w.name as workshop_name,
    w.slug,
    (
        SELECT COUNT(*)
        FROM users u
        WHERE
            u.workshop_id = w.id
    ) as total_staff,
    (
        SELECT COUNT(*)
        FROM bookings b
        WHERE
            b.workshop_id = w.id
            AND b.status = 'PENDING'
    ) as pending_bookings,
    (
        SELECT COUNT(*)
        FROM service_records sr
        WHERE
            sr.workshop_id = w.id
            AND sr.status IN ('WAITING', 'PROCESS')
    ) as active_services,
    (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM service_records sr
        WHERE
            sr.workshop_id = w.id
            AND sr.status = 'PAID'
            AND DATE(sr.finish_time) = CURRENT_DATE
    ) as today_revenue
FROM workshops w
WHERE
    w.is_active = true;

-- ============================================
-- 21. COMMENTS
-- ============================================
COMMENT ON
TABLE workshops IS 'Multi-tenant workshop/bengkel master table';

COMMENT ON
TABLE time_slots IS 'Available booking time slots per workshop';

COMMENT ON
TABLE workshop_invitations IS 'Invitations for staff to join a workshop';

COMMENT ON COLUMN users.workshop_id IS 'The workshop this user belongs to';

COMMENT ON COLUMN users.is_owner IS 'Whether this user is the owner of their workshop';

COMMENT ON COLUMN workshops.slug IS 'URL-friendly identifier used in /booking/:slug';

COMMENT ON COLUMN workshops.settings IS 'JSON object for workshop-specific configuration';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- After running this migration:
-- 1. All existing data will be assigned to 'default-workshop'
-- 2. Guest booking URL will be: /booking/:workshop-slug
-- 3. Each workshop has isolated data
-- 4. RLS policies ensure data separation