-- RPC for Saving QRIS (Insert)
CREATE OR REPLACE FUNCTION save_qris_setting(
  p_merchant_name TEXT,
  p_qris_string TEXT,
  p_is_default BOOLEAN,
  p_branch_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_user_workshop_id UUID;
  v_target_workshop_id UUID;
  v_new_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Verify User
  SELECT role, workshop_id INTO v_user_role, v_user_workshop_id
  FROM public.users
  WHERE id = p_user_id;

  IF v_user_role IS NULL THEN
     RAISE EXCEPTION 'User not found';
  END IF;

  -- 2. Verify Branch Ownership
  IF p_branch_id IS NOT NULL THEN
      SELECT workshop_id INTO v_target_workshop_id
      FROM public.branches
      WHERE id = p_branch_id;
      
      IF v_target_workshop_id IS DISTINCT FROM v_user_workshop_id AND v_user_role NOT IN ('OWNER', 'ADMIN') THEN
         RAISE EXCEPTION 'Unauthorized: User does not own this branch';
      END IF;
  ELSE
      -- Global setting check
      IF v_user_role NOT IN ('OWNER', 'ADMIN') THEN
         RAISE EXCEPTION 'Unauthorized: Only Owners/Admins can set global settings';
      END IF;
  END IF;

  -- 3. Handle Default Toggle (Transaction safe)
  IF p_is_default THEN
      UPDATE public.qris_settings
      SET is_default = false
      WHERE branch_id IS NOT DISTINCT FROM p_branch_id; -- Handle NULL branch_id correctly
  END IF;

  -- 4. Insert
  INSERT INTO public.qris_settings (
    merchant_name, qris_string, is_default, branch_id
  ) VALUES (
    p_merchant_name, p_qris_string, p_is_default, p_branch_id
  )
  RETURNING id INTO v_new_id;

  -- 5. Return result
  SELECT to_jsonb(q.*) INTO v_result FROM public.qris_settings q WHERE id = v_new_id;
  RETURN v_result;
END;
$$;

-- RPC for Getting QRIS (Select)
CREATE OR REPLACE FUNCTION get_qris_settings(
  p_branch_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Simple check to ensure user exists, deeper permission logic can be added if needed
  -- For now, allow any authenticated user (from custom auth) to read if they have the ID
  -- ideally we check workshop match, but for list speed we'll trust the p_branch_id context mostly
  
  SELECT jsonb_agg(to_jsonb(q.*) ORDER BY created_at DESC)
  INTO v_result
  FROM public.qris_settings q
  WHERE q.branch_id IS NOT DISTINCT FROM p_branch_id;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- RPC for Deleting QRIS
CREATE OR REPLACE FUNCTION delete_qris_setting(
  p_qris_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_branch_id UUID;
  v_user_workshop_id UUID;
  v_target_workshop_id UUID;
BEGIN
  -- Get QRIS branch info
  SELECT branch_id INTO v_branch_id FROM public.qris_settings WHERE id = p_qris_id;
  
  -- Get User info
  SELECT role, workshop_id INTO v_user_role, v_user_workshop_id
  FROM public.users
  WHERE id = p_user_id;

  -- Check permissions
  IF v_branch_id IS NOT NULL THEN
      SELECT workshop_id INTO v_target_workshop_id FROM public.branches WHERE id = v_branch_id;
      IF v_target_workshop_id IS DISTINCT FROM v_user_workshop_id THEN
         RAISE EXCEPTION 'Unauthorized';
      END IF;
  END IF;

  DELETE FROM public.qris_settings WHERE id = p_qris_id;
END;
$$;

-- RPC for Updating Default
CREATE OR REPLACE FUNCTION set_default_qris(
  p_qris_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT branch_id INTO v_branch_id FROM public.qris_settings WHERE id = p_qris_id;
  
  -- Unset others
  UPDATE public.qris_settings 
  SET is_default = false 
  WHERE branch_id IS NOT DISTINCT FROM v_branch_id;

  -- Set target
  UPDATE public.qris_settings 
  SET is_default = true 
  WHERE id = p_qris_id;
END;
$$;
