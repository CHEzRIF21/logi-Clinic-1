-- Migration: Ajout des tables pour le suivi d'activité utilisateur
-- Date: 2025-01-XX
-- Description: Création des tables user_login_history et user_activity_logs pour le profil utilisateur intelligent

-- Table pour l'historique des connexions
CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  logout_at TIMESTAMPTZ,
  session_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_clinic_id ON user_login_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_at ON user_login_history(login_at DESC);

-- Table pour les logs d'activité utilisateur
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  module TEXT,
  entity_type TEXT, -- Type d'entité concernée (patient, consultation, prescription, etc.)
  entity_id UUID, -- ID de l'entité concernée
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_clinic_id ON user_activity_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_module ON user_activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);

-- RLS Policies pour user_login_history
ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_login_history" ON user_login_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND (users.role = 'admin' OR users.role = 'CLINIC_ADMIN')
      AND users.clinic_id = user_login_history.clinic_id
    )
  );

CREATE POLICY "system_can_insert_login_history" ON user_login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND (users.role = 'admin' OR users.role = 'CLINIC_ADMIN')
    )
  );

-- RLS Policies pour user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_activity_logs" ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND (users.role = 'admin' OR users.role = 'CLINIC_ADMIN')
      AND users.clinic_id = user_activity_logs.clinic_id
    )
  );

CREATE POLICY "users_can_insert_own_activity_logs" ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text::uuid
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND (users.role = 'admin' OR users.role = 'CLINIC_ADMIN')
    )
  );

-- Fonction pour logger automatiquement les connexions
CREATE OR REPLACE FUNCTION log_user_login(
  p_user_id UUID,
  p_clinic_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_login_id UUID;
BEGIN
  INSERT INTO user_login_history (
    user_id,
    clinic_id,
    ip_address,
    user_agent,
    device_info
  )
  VALUES (
    p_user_id,
    p_clinic_id,
    p_ip_address,
    p_user_agent,
    p_device_info
  )
  RETURNING id INTO v_login_id;
  
  RETURN v_login_id;
END;
$$;

-- Fonction pour logger les activités utilisateur
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_clinic_id UUID,
  p_action TEXT,
  p_module TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    clinic_id,
    action,
    module,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    p_user_id,
    p_clinic_id,
    p_action,
    p_module,
    p_entity_type,
    p_entity_id,
    p_details
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Commentaires pour documentation
COMMENT ON TABLE user_login_history IS 'Historique des connexions des utilisateurs pour le profil utilisateur';
COMMENT ON TABLE user_activity_logs IS 'Logs des activités des utilisateurs dans l''application';
COMMENT ON FUNCTION log_user_login IS 'Fonction pour logger automatiquement une connexion utilisateur';
COMMENT ON FUNCTION log_user_activity IS 'Fonction pour logger une activité utilisateur';
