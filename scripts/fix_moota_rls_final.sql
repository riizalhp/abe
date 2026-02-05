-- FIX: Add missing SELECT policy for payment_orders to prevent 406 Errors
-- The previous RLS policies missed the SELECT permission for 'anon' users.
-- This caused supabase.from('payment_orders').select().single() to return 0 rows (406)
-- even if the order existed.

-- 1. Enable RLS (just in case)
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to be clean
DROP POLICY IF EXISTS "Allow authenticated full access to payment_orders" ON payment_orders;
DROP POLICY IF EXISTS "Allow write access to payment_orders" ON payment_orders;
DROP POLICY IF EXISTS "Allow anon insert payment_orders" ON payment_orders;
DROP POLICY IF EXISTS "Allow anon update payment_orders" ON payment_orders;
DROP POLICY IF EXISTS "Allow anon select payment_orders" ON payment_orders; -- Drop if exists

-- 3. Re-create policies

-- A. Authenticated users (Staff/Admins) have full access
CREATE POLICY "Allow authenticated full access to payment_orders" 
ON payment_orders 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- B. Anon users (Guests) need CRUD for their booking flow
-- SELECT: Needed for polling payment status (Fixes 406 Error)
CREATE POLICY "Allow anon select payment_orders" 
ON payment_orders 
FOR SELECT 
TO anon 
USING (true);

-- INSERT: Needed for creating new orders
CREATE POLICY "Allow anon insert payment_orders" 
ON payment_orders 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- UPDATE: Needed for updating status (e.g., to 'CHECKING')
CREATE POLICY "Allow anon update payment_orders" 
ON payment_orders 
FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Verification
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'payment_orders';
