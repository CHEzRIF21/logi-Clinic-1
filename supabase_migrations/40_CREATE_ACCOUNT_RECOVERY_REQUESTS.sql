-- Migration pour créer la table account_recovery_requests
-- Cette table gère les demandes de récupération de compte utilisateur

CREATE TABLE IF NOT EXISTS account_recovery_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  clinic_code VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  telephone VARCHAR(50),
  security_questions JSONB,
  requested_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  rejected_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  audit_log JSONB DEFAULT '[]'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_clinic_id ON account_recovery_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_status ON account_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_email ON account_recovery_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_created_at ON account_recovery_requests(created_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_account_recovery_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_account_recovery_requests_updated_at
  BEFORE UPDATE ON account_recovery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_account_recovery_requests_updated_at();

-- RLS Policies
ALTER TABLE account_recovery_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Les admins de clinique peuvent voir les demandes de leur clinique
CREATE POLICY "Clinic admins can view recovery requests for their clinic"
  ON account_recovery_requests
  FOR SELECT
  USING (
    clinic_id = (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid()
      AND role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Les admins peuvent créer des demandes (pour leur clinique)
CREATE POLICY "Clinic admins can create recovery requests"
  ON account_recovery_requests
  FOR INSERT
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid()
      AND role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Les admins peuvent mettre à jour les demandes de leur clinique
CREATE POLICY "Clinic admins can update recovery requests for their clinic"
  ON account_recovery_requests
  FOR UPDATE
  USING (
    clinic_id = (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid()
      AND role IN ('CLINIC_ADMIN', 'admin', 'SUPER_ADMIN')
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
    )
  );

-- Commentaires
COMMENT ON TABLE account_recovery_requests IS 'Demandes de récupération de compte utilisateur';
COMMENT ON COLUMN account_recovery_requests.requested_data IS 'Tableau JSON des données demandées: ["username", "clinicCode", "password"]';
COMMENT ON COLUMN account_recovery_requests.security_questions IS 'Questions de sécurité avec réponses hashées';
COMMENT ON COLUMN account_recovery_requests.audit_log IS 'Journal des actions effectuées sur la demande';
