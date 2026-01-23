-- ============================================
-- Migration 46: Suppression du module "Nouvelle Consultation"
-- Ce module a été supprimé du système LogiClinic
-- ============================================

-- Supprimer toutes les permissions liées au module "nouvelle_consultation"
DELETE FROM default_role_permissions 
WHERE module_name = 'nouvelle_consultation';

-- Supprimer toutes les permissions utilisateur liées au module "nouvelle_consultation"
-- (si la table user_permissions existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_permissions') THEN
    DELETE FROM user_permissions 
    WHERE module_name = 'nouvelle_consultation';
  END IF;
END $$;

-- Supprimer toutes les permissions de profil liées au module "nouvelle_consultation"
-- (si la table profile_permissions existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_permissions') THEN
    DELETE FROM profile_permissions 
    WHERE module_name = 'nouvelle_consultation';
  END IF;
END $$;

-- Vérification : Afficher un message de confirmation
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_count
  FROM default_role_permissions
  WHERE module_name = 'nouvelle_consultation';
  
  IF deleted_count = 0 THEN
    RAISE NOTICE '✅ Toutes les permissions du module "nouvelle_consultation" ont été supprimées avec succès';
  ELSE
    RAISE WARNING '⚠️ Il reste % permission(s) pour le module "nouvelle_consultation"', deleted_count;
  END IF;
END $$;

-- Commentaire
COMMENT ON FUNCTION insert_role_permissions IS 'Fonction pour insérer les permissions d''un rôle (le module "nouvelle_consultation" a été supprimé)';
