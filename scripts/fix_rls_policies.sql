-- FIX RLS POLICIES FOR PUBLIC ACCESS
-- Run this in your Supabase SQL Editor to fix "Branch not found" errors for guests

-- 1. Fix 'branches' table policies
-- Ensure RLS is enabled
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Public Read Branches" ON branches;

-- Create policy to allow anyone (including guests) to read branches
CREATE POLICY "Public Read Branches" ON branches FOR SELECT USING (true);


-- 2. Fix 'time_slots' table policies
-- Ensure RLS is enabled
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Public Read Time Slots" ON time_slots;

-- Create policy to allow anyone (including guests) to read time slots
CREATE POLICY "Public Read Time Slots" ON time_slots FOR SELECT USING (true);
