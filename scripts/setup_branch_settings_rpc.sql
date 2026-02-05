-- Create a secure function to update branch settings
-- This bypasses RLS on the 'branches' table by using SECURITY DEFINER
-- but implements its own strict permission check.

CREATE OR REPLACE FUNCTION update_branch_settings(
  p_branch_id UUID,
  p_settings JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner (bypasses RLS)
AS $$
DECLARE
  v_workshop_id UUID;
  v_user_role TEXT;
  v_user_workshop_id UUID;
  v_updated_settings JSONB;
BEGIN
  -- 1. Get the branch's workshop_id
  SELECT workshop_id INTO v_workshop_id
  FROM public.branches
  WHERE id = p_branch_id;

  IF v_workshop_id IS NULL THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  -- 2. Get the current user's role and workshop_id
  SELECT role, workshop_id INTO v_user_role, v_user_workshop_id
  FROM public.users
  WHERE id = auth.uid();

  -- 3. Permission Check:
  -- Must be OWNER or ADMIN match the branch's workshop
  IF v_user_role NOT IN ('OWNER', 'ADMIN') OR v_user_workshop_id IS DISTINCT FROM v_workshop_id THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to update this branch.';
  END IF;

  -- 4. Perform Update
  UPDATE public.branches
  SET settings = p_settings,
      updated_at = NOW() -- Assuming there's an updated_at column, if not, remove this line or check schema
  WHERE id = p_branch_id
  RETURNING settings INTO v_updated_settings;

  RETURN v_updated_settings;
END;
$$;
