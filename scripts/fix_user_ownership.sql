
-- 1. Check current status (for verification)
SELECT id, email, workshop_id, is_owner, role 
FROM users 
WHERE id = '2a9562e5-007a-464a-a082-dfbccd287852';

-- 2. Fix the ownership issue
UPDATE users 
SET 
  is_owner = true,
  role = 'owner', -- Ensure role is also owner
  workshop_id = 'daaad89d-d695-4c53-b2b8-b1ac69355f26' -- Ensure workshop matches
WHERE id = '2a9562e5-007a-464a-a082-dfbccd287852';

-- 3. Verify the fix
SELECT id, email, workshop_id, is_owner, role 
FROM users 
WHERE id = '2a9562e5-007a-464a-a082-dfbccd287852';
