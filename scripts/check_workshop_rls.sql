
-- Check policies on workshops table
SELECT *
FROM pg_policies
WHERE tablename = 'workshops';

-- Check if RLS is enabled on workshops table
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'workshops';

-- Check structure of workshops table to ensure columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workshops';
