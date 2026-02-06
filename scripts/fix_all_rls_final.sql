-- COMPREHENSIVE RLS FIX
-- Run this to fix "Violation of RLS" errors for Adding Branches and Saving Settings

-- ==========================================
-- 1. SWITCH TO SECURE CONTEXT
-- ==========================================
-- (Optional in editor, but good practice)

-- ==========================================
-- 2. TABLE: BRANCHES
-- ==========================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Policy: VIEW (Select)
-- Allow anyone to view active branches (for booking)
DROP POLICY IF EXISTS "Public can view active branches" ON branches;

CREATE POLICY "Public can view active branches" ON branches FOR
SELECT USING (true);

-- Policy: INSERT
-- Allow Owners only to add branches to their own workshop
DROP POLICY IF EXISTS "Owners can insert branches" ON branches;

CREATE POLICY "Owners can insert branches" ON branches FOR
INSERT
WITH
    CHECK (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                workshop_id = branches.workshop_id
                AND role = 'OWNER'
        )
    );

-- Policy: UPDATE
-- Allow Owners & Admins to update their branches
DROP POLICY IF EXISTS "Owners and Admins can update branches" ON branches;

CREATE POLICY "Owners and Admins can update branches" ON branches FOR
UPDATE USING (
    auth.uid () IN (
        SELECT id
        FROM public.users
        WHERE
            workshop_id = branches.workshop_id
            AND role IN ('OWNER', 'ADMIN')
    )
);

-- Policy: DELETE
-- Allow Owners only to delete/archive
DROP POLICY IF EXISTS "Owners can delete branches" ON branches;

CREATE POLICY "Owners can delete branches" ON branches FOR DELETE USING (
    auth.uid () IN (
        SELECT id
        FROM public.users
        WHERE
            workshop_id = branches.workshop_id
            AND role = 'OWNER'
    )
);

-- ==========================================
-- 3. TABLE: WORKSHOPS
-- ==========================================
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Policy: READ
DROP POLICY IF EXISTS "Public can view workshops" ON workshops;

CREATE POLICY "Public can view workshops" ON workshops FOR
SELECT USING (true);

-- Policy: UPDATE (Global Settings)
-- Allow Owners & Admins to update their workshop settings
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