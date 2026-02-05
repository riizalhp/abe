-- FIX AUTH BYPASS RPCS
-- Since the app uses custom auth (not Supabase Auth), we must pass user_id manually

-- 1. Create Branch RPC
CREATE OR REPLACE FUNCTION create_new_branch(
  p_workshop_id UUID,
  p_name TEXT,
  p_code TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_is_main BOOLEAN,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_user_workshop_id UUID;
  v_new_branch_options JSONB;
BEGIN
  -- Verify User Permissions (Custom Auth Check)
  SELECT role, workshop_id INTO v_user_role, v_user_workshop_id
  FROM public.users
  WHERE id = p_user_id;

  IF v_user_role NOT IN ('OWNER', 'ADMIN') OR v_user_workshop_id IS DISTINCT FROM p_workshop_id THEN
    RAISE EXCEPTION 'Unauthorized: User does not have permission to add branch to this workshop.';
  END IF;

  -- Insert Branch
  INSERT INTO public.branches (
    workshop_id, name, code, address, phone, is_main, is_active
  ) VALUES (
    p_workshop_id, p_name, p_code, p_address, p_phone, p_is_main, true
  )
  RETURNING to_jsonb(branches.*) INTO v_new_branch_options;

  RETURN v_new_branch_options;
END;
$$;


-- 2. Update Settings RPC (Modified to take p_user_id)
DROP FUNCTION IF EXISTS update_branch_settings;

CREATE OR REPLACE FUNCTION update_branch_settings(
  p_branch_id UUID,
  p_settings JSONB,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  v_workshop_id UUID;
  v_user_role TEXT;
  v_user_workshop_id UUID;
  v_updated_settings JSONB;
BEGIN
  -- Get Branch Info
  SELECT workshop_id INTO v_workshop_id
  FROM public.branches
  WHERE id = p_branch_id;

  IF v_workshop_id IS NULL THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  -- Verify User Permissions (Custom Auth Check)
  SELECT role, workshop_id INTO v_user_role, v_user_workshop_id
  FROM public.users
  WHERE id = p_user_id;

  IF v_user_role NOT IN ('OWNER', 'ADMIN') OR v_user_workshop_id IS DISTINCT FROM v_workshop_id THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to update this branch.';
  END IF;

  -- Update
  UPDATE public.branches
  SET settings = p_settings,
      updated_at = NOW()
  WHERE id = p_branch_id
  RETURNING settings INTO v_updated_settings;

  RETURN v_updated_settings;
END;
$$;
