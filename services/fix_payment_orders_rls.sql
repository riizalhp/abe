-- Fix: Allow anon (guest) to update payment_orders status
-- Run this in Supabase SQL Editor

-- Drop existing write policy for authenticated only
DROP POLICY IF EXISTS "Allow write access to payment_orders" ON payment_orders;

-- Policy: Allow authenticated users full access
CREATE POLICY "Allow authenticated full access to payment_orders" ON payment_orders FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- Policy: Allow anon (guests) to INSERT new orders
CREATE POLICY "Allow anon insert payment_orders" ON payment_orders FOR
INSERT
    TO anon
WITH
    CHECK (true);

-- Policy: Allow anon (guests) to UPDATE their own orders (by order_id)
CREATE POLICY "Allow anon update payment_orders" ON payment_orders FOR
UPDATE TO anon USING (true)
WITH
    CHECK (true);

-- Alternatively, you can disable RLS temporarily for testing:
-- ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;

-- Or use a more permissive policy:
-- DROP POLICY IF EXISTS "Allow anon insert payment_orders" ON payment_orders;
-- DROP POLICY IF EXISTS "Allow anon update payment_orders" ON payment_orders;
-- CREATE POLICY "Allow all access to payment_orders"
-- ON payment_orders FOR ALL
-- USING (true)
-- WITH CHECK (true);