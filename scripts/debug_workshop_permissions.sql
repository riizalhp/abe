-- ==========================================
-- DEBUG: Check Current User's Role and Permissions
-- ==========================================
-- Run this to check your current user's role and workshop association

-- 1. Check current authenticated user
SELECT auth.uid () as my_user_id, auth.email () as my_email;

-- 2. Check user's role and workshop
SELECT
    id,
    name,
    email,
    role,
    is_owner,
    workshop_id,
    branch_id,
    CASE
        WHEN role IN ('OWNER', 'ADMIN') THEN '✅ Can update workshop'
        ELSE '❌ Cannot update workshop'
    END as update_permission
FROM users
WHERE
    id = auth.uid ();

-- 3. Check workshop details
SELECT w.id, w.name, w.slug, w.address, w.phone, w.email, w.settings
FROM workshops w
WHERE
    w.id IN (
        SELECT workshop_id
        FROM users
        WHERE
            id = auth.uid ()
    );

-- 4. Check which UPDATE policies apply to current user
SELECT
    'Policy: ' || policyname as policy_info,
    cmd,
    CASE
        WHEN policyname LIKE '%is_owner%'
        OR qual LIKE '%is_owner%' THEN 'Uses is_owner field'
        WHEN qual LIKE '%role%' THEN 'Uses role field'
        ELSE 'Other'
    END as condition_type
FROM pg_policies
WHERE
    tablename = 'workshops'
    AND cmd = 'UPDATE';

-- 5. Test if current user can see their workshop (SELECT policy)
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM workshops
            WHERE
                id = (
                    SELECT workshop_id
                    FROM users
                    WHERE
                        id = auth.uid ()
                )
        ) THEN '✅ Can SELECT workshop'
        ELSE '❌ Cannot SELECT workshop'
    END as select_test;

-- 6. Check if policies are properly configured
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check,
    CASE
        WHEN cmd = 'UPDATE'
        AND (
            qual IS NULL
            OR with_check IS NULL
        ) THEN '⚠️ INCOMPLETE POLICY'
        ELSE '✅ OK'
    END as policy_status
FROM pg_policies
WHERE
    tablename = 'workshops'
ORDER BY cmd, policyname;