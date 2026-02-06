
-- 1. FORCE FIX USER STATUS
-- Memastikan user ini benar-benar owner di database
UPDATE users 
SET 
    is_owner = true, 
    role = 'owner',
    workshop_id = 'daaad89d-d695-4c53-b2b8-b1ac69355f26'
WHERE id = '2a9562e5-007a-464a-a082-dfbccd287852';


-- 2. UPDATE RPC FUNCTION LEBIH PINTAR
-- Function ini akan mencoba memperbaiki status owner otomatis jika role-nya 'owner'
-- Dan memberikan pesan error yang SANGAT DETAIL jika masih gagal
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
  v_user_id := auth.uid();
  
  -- Ambil info user
  SELECT is_owner, workshop_id, role INTO v_is_owner, v_user_workshop_id, v_role
  FROM users
  WHERE id = v_user_id;

  -- 1. Cek User ID
  IF v_user_id IS NULL THEN
     RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: No User ID found (Not logged in?)');
  END IF;

  -- 2. Cek Workshop Match
  IF v_user_workshop_id IS DISTINCT FROM p_workshop_id THEN
     RETURN jsonb_build_object('success', false, 'error', format('Unauthorized: User workshop (%s) does not match target (%s)', v_user_workshop_id, p_workshop_id));
  END IF;

  -- 3. Cek Owner Status
  IF v_is_owner IS NOT TRUE THEN
     -- AUTO-FIX: Jika role di DB tertulis 'owner' tapi is_owner false, kita betulkan otomatis
     IF v_role = 'owner' OR v_role = 'OWNER' THEN
        UPDATE users SET is_owner = true WHERE id = v_user_id;
        v_is_owner := true; -- Update variable lokal
     ELSE
        RETURN jsonb_build_object('success', false, 'error', format('Unauthorized: Database says is_owner=FALSE. Your Role is: %s', v_role));
     END IF;
  END IF;

  -- Proceed Update
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
