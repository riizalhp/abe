
-- Function to update workshop details securely
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
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is owner of this workshop
  SELECT is_owner INTO v_is_owner
  FROM users
  WHERE id = v_user_id AND workshop_id = p_workshop_id;
  
  IF v_is_owner IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the owner of this workshop');
  END IF;

  -- Update workshop
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
