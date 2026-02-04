-- ============================================
-- MIGRATION: 24_SAFE_MULTI_TENANT.sql
-- Description: Dynamic Multi-Tenant Migration
-- ============================================

-- 1. Create Base Tables (Safe)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  is_temporary_code BOOLEAN DEFAULT false,
  requires_code_change BOOLEAN DEFAULT false,
  created_by_super_admin UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure clinics table has all required columns (if created by older migration)
DO $$
BEGIN
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_temporary_code BOOLEAN DEFAULT false;
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS requires_code_change BOOLEAN DEFAULT false;
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_by_super_admin UUID;
END $$;

-- Users table (usually exists, but ensuring clinic_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'clinic_id') THEN
        ALTER TABLE users ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 2. Create Helper Functions
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Check if table users exists to avoid error if called too early (though unlikely here)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      SELECT clinic_id INTO v_clinic_id
      FROM users
      WHERE auth_user_id = auth.uid()
      LIMIT 1;
      RETURN v_clinic_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN get_my_clinic_id();
END;
$$;

CREATE OR REPLACE FUNCTION check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      SELECT role INTO v_role
      FROM users
      WHERE auth_user_id = auth.uid()
      LIMIT 1;
      RETURN COALESCE(v_role = 'SUPER_ADMIN', false);
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION check_is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      SELECT role INTO v_role
      FROM users
      WHERE auth_user_id = auth.uid()
      LIMIT 1;
      RETURN COALESCE(v_role = 'CLINIC_ADMIN', false);
  END IF;
  RETURN false;
END;
$$;


-- 3. Dynamic Schema Update
-- Iterate over all tables in public schema except system/core tables
-- Add clinic_id, create index, enable RLS
DO $$
DECLARE
    r RECORD;
    v_clinic_demo_id UUID;
BEGIN
    -- Ensure Demo Clinic Exists
    INSERT INTO clinics (code, name, active, is_demo)
    VALUES ('CLINIC001', 'Clinique Démo', true, true)
    ON CONFLICT (code) DO UPDATE SET active = true
    RETURNING id INTO v_clinic_demo_id;

    -- If existing clinic was updated, get its ID
    IF v_clinic_demo_id IS NULL THEN
        SELECT id INTO v_clinic_demo_id FROM clinics WHERE code = 'CLINIC001';
    END IF;

    -- Iterate tables
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('clinics', 'users', 'schema_migrations', 'spatial_ref_sys')
    ) LOOP
        
        -- Add clinic_id column if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'clinic_id') THEN
            RAISE NOTICE 'Adding clinic_id to %', r.tablename;
            EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE';
            
            -- Assign default clinic to existing rows
            EXECUTE 'UPDATE ' || quote_ident(r.tablename) || ' SET clinic_id = $1 WHERE clinic_id IS NULL' USING v_clinic_demo_id;
        ELSE
             -- Even if exists, ensure existing rows have clinic_id
             EXECUTE 'UPDATE ' || quote_ident(r.tablename) || ' SET clinic_id = $1 WHERE clinic_id IS NULL' USING v_clinic_demo_id;
        END IF;

        -- Create Index
        EXECUTE 'CREATE INDEX IF NOT EXISTS ' || quote_ident('idx_' || r.tablename || '_clinic_id') || ' ON ' || quote_ident(r.tablename) || '(clinic_id)';

        -- Enable RLS
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
        
        -- Create Basic Isolation Policy (Safe, will be refined by 82)
        EXECUTE 'DROP POLICY IF EXISTS "clinic_isolation_safe_' || r.tablename || '" ON ' || quote_ident(r.tablename);
        
        -- Only create policy if it doesn't conflict with existing ones (we use a unique name)
        EXECUTE 'CREATE POLICY "clinic_isolation_safe_' || r.tablename || '" ON ' || quote_ident(r.tablename) || '
                 FOR ALL TO authenticated
                 USING (clinic_id = get_current_user_clinic_id() OR check_is_super_admin())
                 WITH CHECK (clinic_id = get_current_user_clinic_id() OR check_is_super_admin())';
                 
    END LOOP;
END $$;


-- 4. Create Clinic Management Functions
CREATE OR REPLACE FUNCTION get_clinic_id_by_code(p_clinic_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id
  FROM clinics
  WHERE code = UPPER(TRIM(p_clinic_code))
    AND active = true
  LIMIT 1;
  RETURN v_clinic_id;
END;
$$;
GRANT EXECUTE ON FUNCTION get_clinic_id_by_code(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION super_admin_create_clinic(
  p_clinic_name TEXT,
  p_clinic_address TEXT DEFAULT NULL,
  p_clinic_phone TEXT DEFAULT NULL,
  p_clinic_email TEXT DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL,
  p_admin_nom TEXT DEFAULT 'Admin',
  p_admin_prenom TEXT DEFAULT 'Clinique',
  p_admin_telephone TEXT DEFAULT NULL,
  p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_clinic_code TEXT;
  v_user_id UUID;
  v_password_hash TEXT;
  v_temp_password TEXT;
  v_result JSONB;
  v_year TEXT;
  v_sequence_num INT;
BEGIN
  -- Basic Super Admin Check (simplified for migration safety)
  IF EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN' AND auth_user_id = auth.uid()) THEN
      -- OK
  ELSIF EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN') THEN
       -- Super admins exist but current user isn't one -> block
       RAISE EXCEPTION 'Not a Super Admin';
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'CLIN-\d{4}-(\d+)') AS INT)), 0) + 1
  INTO v_sequence_num FROM clinics WHERE code LIKE 'CLIN-' || v_year || '-%';
  
  v_clinic_code := 'CLIN-' || v_year || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
  
  v_temp_password := 'Temp' || SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8) || '!';
  -- Note: pgcrypto extension should be enabled for digest if using it directly, or use plain text/app logic
  -- Assuming pgcrypto calls in app code, here we store hash. 
  -- We'll just define password_hash logic in JS or use generic hashing if extension enabled.
  -- Assuming pgcrypto enabled in previous migration.
  
  -- Create Clinic
  INSERT INTO clinics (code, name, address, phone, email, active, is_demo, created_by_super_admin)
  VALUES (v_clinic_code, p_clinic_name, p_clinic_address, p_clinic_phone, p_clinic_email, true, p_is_demo, auth.uid())
  RETURNING id INTO v_clinic_id;

  -- Create Admin if email provided
  IF p_admin_email IS NOT NULL THEN
      INSERT INTO users (email, nom, prenom, role, status, clinic_id, actif, created_by)
      VALUES (
        LOWER(TRIM(p_admin_email)), p_admin_nom, p_admin_prenom, 'CLINIC_ADMIN', 'PENDING', v_clinic_id, true, auth.uid()
      )
      RETURNING id INTO v_user_id;
  END IF;

  RETURN jsonb_build_object(
      'success', true,
      'clinic_code', v_clinic_code,
      'clinic_id', v_clinic_id,
      'temp_password', v_temp_password
  );
END;
$$;
GRANT EXECUTE ON FUNCTION super_admin_create_clinic TO authenticated;
