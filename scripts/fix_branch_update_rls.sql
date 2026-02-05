-- FIX RLS POLICIES FOR BRANCH UPDATE
-- Run this in your Supabase SQL Editor to allow saving Booking Fees and other Branch settings

-- 1. Enable RLS on branches (should already be enabled, but good to ensure)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- 2. Create POLICY to allow UPDATE on branches
-- Only allow if the user belongs to the SAME workshop and is an OWNER or ADMIN
DROP POLICY IF EXISTS "Enable update for workshop owners and admins" ON branches;

CREATE POLICY "Enable update for workshop owners and admins" ON "public"."branches"
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE workshop_id = branches.workshop_id 
    AND (role = 'OWNER' OR role = 'ADMIN')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE workshop_id = branches.workshop_id 
    AND (role = 'OWNER' OR role = 'ADMIN')
  )
);

-- 3. Also ensure INSERT policy exists (for creating new branches)
DROP POLICY IF EXISTS "Enable insert for workshop owners" ON branches;

CREATE POLICY "Enable insert for workshop owners" ON "public"."branches"
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE workshop_id = branches.workshop_id 
    AND role = 'OWNER'
  )
);
