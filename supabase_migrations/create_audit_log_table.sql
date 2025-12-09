-- Table pour le journal d'audit (traçabilité Qui/Quoi/Quand)
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consult_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_name TEXT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip VARCHAR(45),
  device VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_audit_log_consult_id ON audit_log(consult_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_log_consult_timestamp ON audit_log(consult_id, timestamp DESC);

-- Table pour stocker les étapes de consultation avec traçabilité
CREATE TABLE IF NOT EXISTS consultation_steps (
  step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consult_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  data JSONB,
  completed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft', -- draft, in_progress, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consult_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_consultation_steps_consult_id ON consultation_steps(consult_id);
CREATE INDEX IF NOT EXISTS idx_consultation_steps_step_number ON consultation_steps(step_number);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_consultation_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultation_steps_updated_at
  BEFORE UPDATE ON consultation_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_steps_updated_at();

-- RLS (Row Level Security) pour audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their consultations"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = audit_log.consult_id
      AND (consultations.created_by = auth.uid() OR consultations.opened_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM roles_permissions
      WHERE roles_permissions.role_label = 'admin'
      AND roles_permissions.can_see_sensitive = true
    )
  );

CREATE POLICY "Users can insert audit logs for their consultations"
  ON audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = audit_log.consult_id
      AND (consultations.created_by = auth.uid() OR consultations.opened_by = auth.uid())
    )
  );

-- RLS pour consultation_steps
ALTER TABLE consultation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps for their consultations"
  ON consultation_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = consultation_steps.consult_id
      AND (consultations.created_by = auth.uid() OR consultations.opened_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert steps for their consultations"
  ON consultation_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = consultation_steps.consult_id
      AND (consultations.created_by = auth.uid() OR consultations.opened_by = auth.uid())
    )
  );

CREATE POLICY "Users can update steps for their consultations"
  ON consultation_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = consultation_steps.consult_id
      AND (consultations.created_by = auth.uid() OR consultations.opened_by = auth.uid())
    )
  );

