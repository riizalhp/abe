-- ==========================================
-- CLEANUP: Remove Duplicate Workshop UPDATE Policies
-- ==========================================
-- Problem: Two UPDATE policies exist on workshops table:
--   1. "Owners and Admins can update details" (uses role)
--   2. "Owners can update their workshop" (uses is_owner)
-- This can cause conflicts and confusion
-- Solution: Keep only the role-based policy (more flexible)

-- Step 1: Drop the old policy that uses is_owner
DROP POLICY IF EXISTS "Owners can update their workshop" ON workshops;

-- Step 2: Ensure the correct policy exists (role-based)
DROP POLICY IF EXISTS "Owners and Admins can update details" ON workshops;

CREATE POLICY "Owners and Admins can update details" ON workshops FOR
UPDATE USING (
    auth.uid () IN (
        SELECT id
        FROM public.users
        WHERE
            workshop_id = workshops.id
            AND role IN ('OWNER', 'ADMIN')
    )
)
WITH
    CHECK (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                workshop_id = workshops.id
                AND role IN ('OWNER', 'ADMIN')
        )
    );

-- Step 3: Also ensure DELETE policy is consistent
DROP POLICY IF EXISTS "Owners can delete their workshop" ON workshops;

CREATE POLICY "Owners can delete their workshop" ON workshops FOR DELETE USING (
    auth.uid () IN (
        SELECT id
        FROM public.users
        WHERE
            workshop_id = workshops.id
            AND role = 'OWNER'
    )
);

-- Step 4: Verify only one UPDATE policy exists
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    CASE
        WHEN qual LIKE '%is_owner%' THEN '⚠️ USES is_owner (OLD)'
        WHEN qual LIKE '%role%' THEN '✅ USES role (NEW)'
        ELSE 'UNKNOWN'
    END as policy_type
FROM pg_policies
WHERE
    tablename = 'workshops'
    AND cmd IN ('UPDATE', 'DELETE')
ORDER BY cmd, policyname;