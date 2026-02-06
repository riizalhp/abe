
-- Enable RLS on workshops table
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active workshops" ON workshops;
DROP POLICY IF EXISTS "Owners can update their own workshop" ON workshops;
DROP POLICY IF EXISTS "Authenticated users can create workshops" ON workshops;
DROP POLICY IF EXISTS "Users can view their own workshop" ON workshops;

-- 1. Public can view active workshops (needed for guest booking page)
CREATE POLICY "Public can view active workshops"
ON workshops FOR SELECT
USING (is_active = true);

-- 2. Owners can view their own workshop (even if inactive)
CREATE POLICY "Owners can view their own workshop"
ON workshops FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT workshop_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- 3. Owners can update their own workshop
CREATE POLICY "Owners can update their own workshop"
ON workshops FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT workshop_id 
    FROM users 
    WHERE id = auth.uid() 
    AND is_owner = true
  )
)
WITH CHECK (
  id IN (
    SELECT workshop_id 
    FROM users 
    WHERE id = auth.uid() 
    AND is_owner = true
  )
);

-- 4. Allow authenticated users to create workshops (initial setup)
CREATE POLICY "Authenticated users can create workshops"
ON workshops FOR INSERT
TO authenticated
WITH CHECK (true);

-- Debug: Log the policy changes
DO $$
BEGIN
    RAISE NOTICE 'Refreshed RLS policies for workshops table';
END $$;