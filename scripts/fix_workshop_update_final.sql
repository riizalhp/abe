
-- Drop function first to ensure clean replace
DROP FUNCTION IF EXISTS update_workshop_details(UUID, TEXT, TEXT, TEXT, TEXT);

-- Recreate with AUTO-CORRECT logic
CREATE OR REPLACE FUNCTION update_workshop_details(
  p_workshop_id UUID,
  p_name TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_owner BOOLEAN;
  v_role TEXT;
  v_user_workshop_id UUID;
BEGIN
  -- 1. Get User Info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
     RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: No User ID found (Not logged in?)');
  END IF;

  SELECT is_owner, workshop_id, role INTO v_is_owner, v_user_workshop_id, v_role
  FROM users
  WHERE id = v_user_id;

  -- 2. AUTO-CORRECT: Link User to Workshop if needed
  -- If user is owner/admin but has no workshop_id or different one, link them to this workshop
  IF v_user_workshop_id IS DISTINCT FROM p_workshop_id THEN
     IF v_role = 'owner' OR v_role = 'OWNER' OR v_is_owner = true THEN
         -- Fix the user's record to match this workshop
         UPDATE users 
         SET workshop_id = p_workshop_id, is_owner = true 
         WHERE id = v_user_id;
         
         -- Update variables
         v_user_workshop_id := p_workshop_id;
         v_is_owner := true;
     ELSE
         RETURN jsonb_build_object('success', false, 'error', format('Unauthorized: Workshop mismatch. User belongs to %s, trying to update %s', v_user_workshop_id, p_workshop_id));
     END IF;
  END IF;

  -- 3. AUTO-CORRECT: Ensure is_owner flag
  IF v_is_owner IS NOT TRUE THEN
     IF v_role = 'owner' OR v_role = 'OWNER' THEN
        UPDATE users SET is_owner = true WHERE id = v_user_id;
     ELSE
        RETURN jsonb_build_object('success', false, 'error', format('Unauthorized: Not an owner. Role: %s', v_role));
     END IF;
  END IF;

  -- 4. Proceed Update
  UPDATE workshops
  SET 
    name = COALESCE(p_name, name),
    address = COALESCE(p_address, address),
    phone = COALESCE(p_phone, phone),
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_workshop_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
