-- Enable RLS on qris_settings
ALTER TABLE qris_settings ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON qris_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON qris_settings;
DROP POLICY IF EXISTS "Enable update for owners" ON qris_settings;
DROP POLICY IF EXISTS "Enable delete for owners" ON qris_settings;

DROP POLICY IF EXISTS "Owners and Admins can view own qris" ON qris_settings;
DROP POLICY IF EXISTS "Owners and Admins can insert qris" ON qris_settings;
DROP POLICY IF EXISTS "Owners and Admins can update own qris" ON qris_settings;
DROP POLICY IF EXISTS "Owners and Admins can delete own qris" ON qris_settings;

-- 1. VIEW POLICY (SELECT)
-- Allow users to view QRIS if they belong to the same workshop (via branch linkage)
CREATE POLICY "Owners and Admins can view own qris" ON qris_settings
FOR SELECT USING (
  auth.uid() IN (
    SELECT u.id FROM public.users u
    JOIN public.branches b ON b.workshop_id = u.workshop_id
    WHERE b.id = qris_settings.branch_id
  )
  OR 
  -- Allow global settings if no branch_id (backward compatibility or global defaults)
  (
    branch_id IS NULL AND 
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.role IN ('OWNER', 'ADMIN')
    )
  )
);

-- 2. INSERT POLICY
-- Allow Owners/Admins to insert QRIS for their branches
CREATE POLICY "Owners and Admins can insert qris" ON qris_settings
FOR INSERT WITH CHECK (
  auth.uid() IN (
      SELECT u.id FROM public.users u
      JOIN public.branches b ON b.workshop_id = u.workshop_id
      WHERE b.id = qris_settings.branch_id
  )
);

-- 3. UPDATE POLICY
CREATE POLICY "Owners and Admins can update own qris" ON qris_settings
FOR UPDATE USING (
  auth.uid() IN (
      SELECT u.id FROM public.users u
      JOIN public.branches b ON b.workshop_id = u.workshop_id
      WHERE b.id = qris_settings.branch_id
      AND u.role IN ('OWNER', 'ADMIN')
  )
);

-- 4. DELETE POLICY
CREATE POLICY "Owners and Admins can delete own qris" ON qris_settings
FOR DELETE USING (
  auth.uid() IN (
      SELECT u.id FROM public.users u
      JOIN public.branches b ON b.workshop_id = u.workshop_id
      WHERE b.id = qris_settings.branch_id
      AND u.role IN ('OWNER', 'ADMIN')
  )
);
