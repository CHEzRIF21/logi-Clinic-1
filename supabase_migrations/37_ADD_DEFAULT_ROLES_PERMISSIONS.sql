-- ============================================
-- Migration 37: Ajout des rôles et permissions par défaut
-- Implémentation des 9 rôles métier LogiClinic avec leurs permissions
-- ============================================

-- Table pour stocker les définitions de rôles
CREATE TABLE IF NOT EXISTS role_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les permissions par défaut par rôle
CREATE TABLE IF NOT EXISTS default_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) NOT NULL REFERENCES role_definitions(role_code) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  permission_action VARCHAR(20) NOT NULL,
  submodule_name VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_code, module_name, permission_action, submodule_name)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code ON default_role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON default_role_permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_role_definitions_code ON role_definitions(role_code);

-- Insertion des 9 rôles métier
INSERT INTO role_definitions (role_code, role_name, description, is_admin) VALUES
  ('admin', 'Administrateur Clinique', 'Responsable du centre - Accès complet à tous les modules', true),
  ('medecin', 'Médecin', 'Prise en charge médicale - Diagnostic et prescription', false),
  ('infirmier', 'Infirmier', 'Soins et suivi - Constantes et soins', false),
  ('sage_femme', 'Sage-femme', 'Soins et suivi maternité - CPN, accouchements, post-partum', false),
  ('pharmacien', 'Pharmacien', 'Gestion médicaments - Stocks et délivrance', false),
  ('technicien_labo', 'Technicien de Laboratoire', 'Examens biologiques - Résultats laboratoire', false),
  ('imagerie', 'Imagerie / Échographie', 'Examens d''imagerie - Échographie et imagerie médicale', false),
  ('caissier', 'Caissier', 'Facturation et paiements - Caisse et journal', false),
  ('receptionniste', 'Réceptionniste / Accueil', 'Enregistrement & RDV - Création patients et rendez-vous', false),
  ('auditeur', 'Auditeur / Direction', 'Lecture stratégique - Rapports en lecture seule', false)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

-- Fonction pour insérer les permissions d'un rôle
CREATE OR REPLACE FUNCTION insert_role_permissions(
  p_role_code VARCHAR(50),
  p_module_name VARCHAR(50),
  p_actions TEXT[],
  p_submodules JSONB DEFAULT NULL
) RETURNS void AS $$
DECLARE
  action_item VARCHAR(20);
  submodule_item JSONB;
BEGIN
  -- Insérer les permissions au niveau module
  FOREACH action_item IN ARRAY p_actions
  LOOP
    INSERT INTO default_role_permissions (role_code, module_name, permission_action)
    VALUES (p_role_code, p_module_name, action_item)
    ON CONFLICT (role_code, module_name, permission_action, submodule_name) DO NOTHING;
  END LOOP;

  -- Insérer les permissions au niveau sous-module si fournies
  IF p_submodules IS NOT NULL THEN
    FOR submodule_item IN SELECT * FROM jsonb_array_elements(p_submodules)
    LOOP
      FOREACH action_item IN ARRAY (SELECT ARRAY(SELECT jsonb_array_elements_text(submodule_item->'actions')))
      LOOP
        INSERT INTO default_role_permissions (role_code, module_name, permission_action, submodule_name)
        VALUES (p_role_code, p_module_name, action_item, submodule_item->>'submodule')
        ON CONFLICT (role_code, module_name, permission_action, submodule_name) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insertion des permissions pour Administrateur Clinique
SELECT insert_role_permissions('admin', 'dashboard', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "statistiques", "actions": ["read", "write", "export", "admin"]}, {"submodule": "graphiques", "actions": ["read", "write", "export", "admin"]}, {"submodule": "rapports", "actions": ["read", "write", "delete", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'gestion_patients', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "creation", "actions": ["read", "write", "admin"]}, {"submodule": "modification", "actions": ["read", "write", "delete", "admin"]}, {"submodule": "dossier", "actions": ["read", "write", "export", "admin"]}, {"submodule": "historique", "actions": ["read", "export", "admin"]}, {"submodule": "export", "actions": ["read", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'consultations', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "liste", "actions": ["read", "export", "admin"]}, {"submodule": "historique", "actions": ["read", "export", "admin"]}, {"submodule": "details", "actions": ["read", "write", "export", "admin"]}, {"submodule": "prescriptions", "actions": ["read", "write", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'pharmacie', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "dispensation", "actions": ["read", "write", "export", "admin"]}, {"submodule": "prescriptions", "actions": ["read", "write", "export", "admin"]}, {"submodule": "inventaire", "actions": ["read", "write", "export", "admin"]}, {"submodule": "alertes", "actions": ["read", "write", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'laboratoire', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "demandes", "actions": ["read", "write", "export", "admin"]}, {"submodule": "resultats", "actions": ["read", "write", "export", "admin"]}, {"submodule": "validation", "actions": ["read", "write", "admin"]}, {"submodule": "rapports", "actions": ["read", "write", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'imagerie', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "demandes", "actions": ["read", "write", "export", "admin"]}, {"submodule": "examens", "actions": ["read", "write", "export", "admin"]}, {"submodule": "annotations", "actions": ["read", "write", "export", "admin"]}, {"submodule": "rapports", "actions": ["read", "write", "export", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'caisse', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "tableau_bord", "actions": ["read", "write", "export", "admin"]}, {"submodule": "tickets", "actions": ["read", "write", "export", "admin"]}, {"submodule": "creation_facture", "actions": ["read", "write", "admin"]}, {"submodule": "paiements", "actions": ["read", "write", "export", "admin"]}, {"submodule": "journal", "actions": ["read", "write", "export", "admin"]}, {"submodule": "rapports", "actions": ["read", "write", "export", "admin"]}, {"submodule": "cloture", "actions": ["read", "write", "admin"]}]'::jsonb);

SELECT insert_role_permissions('admin', 'utilisateurs_permissions', ARRAY['read', 'write', 'delete', 'export', 'admin'],
  '[{"submodule": "gestion_utilisateurs", "actions": ["read", "write", "delete", "admin"]}, {"submodule": "gestion_profils", "actions": ["read", "write", "delete", "admin"]}, {"submodule": "configuration_permissions", "actions": ["read", "write", "admin"]}]'::jsonb);

-- Insertion des permissions pour Médecin
SELECT insert_role_permissions('medecin', 'gestion_patients', ARRAY['read', 'write'],
  '[{"submodule": "creation", "actions": ["read", "write"]}, {"submodule": "modification", "actions": ["read", "write"]}, {"submodule": "dossier", "actions": ["read", "write"]}, {"submodule": "historique", "actions": ["read"]}]'::jsonb);

SELECT insert_role_permissions('medecin', 'consultations', ARRAY['read', 'write'],
  '[{"submodule": "liste", "actions": ["read"]}, {"submodule": "historique", "actions": ["read"]}, {"submodule": "details", "actions": ["read", "write"]}, {"submodule": "prescriptions", "actions": ["read", "write"]}]'::jsonb);

SELECT insert_role_permissions('medecin', 'laboratoire', ARRAY['read', 'write'],
  '[{"submodule": "demandes", "actions": ["read", "write"]}, {"submodule": "resultats", "actions": ["read"]}]'::jsonb);

-- Insertion des permissions pour Infirmier
SELECT insert_role_permissions('infirmier', 'gestion_patients', ARRAY['read'],
  '[{"submodule": "dossier", "actions": ["read"]}, {"submodule": "historique", "actions": ["read"]}]'::jsonb);

SELECT insert_role_permissions('infirmier', 'consultations', ARRAY['read', 'write'],
  '[{"submodule": "liste", "actions": ["read"]}, {"submodule": "details", "actions": ["read", "write"]}]'::jsonb);

-- Insertion des permissions pour Sage-femme (même que infirmier + maternité)
SELECT insert_role_permissions('sage_femme', 'gestion_patients', ARRAY['read'],
  '[{"submodule": "dossier", "actions": ["read"]}, {"submodule": "historique", "actions": ["read"]}]'::jsonb);

SELECT insert_role_permissions('sage_femme', 'consultations', ARRAY['read', 'write'],
  '[{"submodule": "liste", "actions": ["read"]}, {"submodule": "details", "actions": ["read", "write"]}]'::jsonb);

SELECT insert_role_permissions('sage_femme', 'maternite', ARRAY['read', 'write'],
  '[{"submodule": "dossiers", "actions": ["read", "write"]}, {"submodule": "cpn", "actions": ["read", "write"]}, {"submodule": "accouchements", "actions": ["read", "write"]}, {"submodule": "post_partum", "actions": ["read", "write"]}]'::jsonb);

-- Insertion des permissions pour Pharmacien
SELECT insert_role_permissions('pharmacien', 'pharmacie', ARRAY['read', 'write', 'export'],
  '[{"submodule": "dispensation", "actions": ["read", "write", "export"]}, {"submodule": "prescriptions", "actions": ["read", "write"]}, {"submodule": "inventaire", "actions": ["read", "write", "export"]}, {"submodule": "alertes", "actions": ["read", "write"]}]'::jsonb);

SELECT insert_role_permissions('pharmacien', 'stock_medicaments', ARRAY['read', 'write', 'export'],
  '[{"submodule": "inventaire", "actions": ["read", "write", "export"]}, {"submodule": "entrees", "actions": ["read", "write"]}, {"submodule": "sorties", "actions": ["read", "write"]}, {"submodule": "alertes", "actions": ["read", "write"]}]'::jsonb);

SELECT insert_role_permissions('pharmacien', 'bilan', ARRAY['read', 'export'],
  '[{"submodule": "consultation", "actions": ["read", "export"]}, {"submodule": "export", "actions": ["read", "export"]}]'::jsonb);

-- Insertion des permissions pour Technicien de Laboratoire
SELECT insert_role_permissions('technicien_labo', 'laboratoire', ARRAY['read', 'write'],
  '[{"submodule": "demandes", "actions": ["read"]}, {"submodule": "resultats", "actions": ["read", "write"]}, {"submodule": "validation", "actions": ["read", "write"]}]'::jsonb);

-- Insertion des permissions pour Imagerie
SELECT insert_role_permissions('imagerie', 'imagerie', ARRAY['read', 'write', 'export'],
  '[{"submodule": "demandes", "actions": ["read"]}, {"submodule": "examens", "actions": ["read", "write", "export"]}, {"submodule": "annotations", "actions": ["read", "write"]}, {"submodule": "rapports", "actions": ["read", "write", "export"]}]'::jsonb);

-- Insertion des permissions pour Caissier
SELECT insert_role_permissions('caissier', 'caisse', ARRAY['read', 'write', 'export'],
  '[{"submodule": "tableau_bord", "actions": ["read"]}, {"submodule": "tickets", "actions": ["read", "write"]}, {"submodule": "creation_facture", "actions": ["read", "write"]}, {"submodule": "paiements", "actions": ["read", "write", "export"]}, {"submodule": "journal", "actions": ["read", "write", "export"]}, {"submodule": "rapports", "actions": ["read", "export"]}]'::jsonb);

-- Insertion des permissions pour Réceptionniste
SELECT insert_role_permissions('receptionniste', 'gestion_patients', ARRAY['read', 'write'],
  '[{"submodule": "creation", "actions": ["read", "write"]}]'::jsonb);

SELECT insert_role_permissions('receptionniste', 'rendez_vous', ARRAY['read', 'write'],
  '[{"submodule": "planification", "actions": ["read", "write"]}, {"submodule": "gestion", "actions": ["read", "write"]}, {"submodule": "annulation", "actions": ["read", "write"]}]'::jsonb);

-- Insertion des permissions pour Auditeur
SELECT insert_role_permissions('auditeur', 'dashboard', ARRAY['read', 'export'],
  '[{"submodule": "statistiques", "actions": ["read", "export"]}, {"submodule": "graphiques", "actions": ["read", "export"]}, {"submodule": "rapports", "actions": ["read", "export"]}]'::jsonb);

SELECT insert_role_permissions('auditeur', 'bilan', ARRAY['read', 'export'],
  '[{"submodule": "consultation", "actions": ["read", "export"]}, {"submodule": "export", "actions": ["read", "export"]}]'::jsonb);

SELECT insert_role_permissions('auditeur', 'caisse', ARRAY['read', 'export'],
  '[{"submodule": "rapports", "actions": ["read", "export"]}, {"submodule": "journal", "actions": ["read", "export"]}]'::jsonb);

-- Fonction pour obtenir les permissions par défaut d'un rôle
CREATE OR REPLACE FUNCTION get_default_role_permissions(p_role_code VARCHAR(50))
RETURNS TABLE (
  module_name VARCHAR(50),
  permission_action VARCHAR(20),
  submodule_name VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    drp.module_name,
    drp.permission_action,
    drp.submodule_name
  FROM default_role_permissions drp
  WHERE drp.role_code = p_role_code
  ORDER BY drp.module_name, drp.permission_action, drp.submodule_name;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un rôle a une permission
CREATE OR REPLACE FUNCTION role_has_permission(
  p_role_code VARCHAR(50),
  p_module_name VARCHAR(50),
  p_permission_action VARCHAR(20),
  p_submodule_name VARCHAR(50) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM role_definitions
    WHERE role_code = p_role_code AND is_admin = true
  ) THEN
    RETURN true;
  END IF;

  IF p_submodule_name IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM default_role_permissions
      WHERE role_code = p_role_code
        AND module_name = p_module_name
        AND permission_action = p_permission_action
        AND submodule_name IS NULL
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM default_role_permissions
      WHERE role_code = p_role_code
        AND module_name = p_module_name
        AND permission_action = p_permission_action
        AND submodule_name = p_submodule_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE role_definitions IS 'Définitions des rôles métier disponibles dans LogiClinic';
COMMENT ON TABLE default_role_permissions IS 'Permissions par défaut associées à chaque rôle';
COMMENT ON FUNCTION get_default_role_permissions IS 'Récupère toutes les permissions par défaut d''un rôle';
COMMENT ON FUNCTION role_has_permission IS 'Vérifie si un rôle a une permission spécifique';

