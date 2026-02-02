-- ============================================
-- ADD email_verified to users table
-- ============================================
-- Objectif:
-- - Ajouter un champ email_verified pour bloquer la connexion jusqu'à vérification email
-- - Workflow: PENDING → APPROVED (admin) → email_verified=true (utilisateur)
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne email_verified si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN email_verified BOOLEAN DEFAULT false NOT NULL;
    
    -- Marquer tous les comptes existants comme vérifiés (pour éviter de bloquer les utilisateurs actuels)
    UPDATE public.users
    SET email_verified = true
    WHERE status = 'ACTIVE' AND actif = true;
    
    RAISE NOTICE '✅ Colonne email_verified ajoutée à users';
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified
  ON public.users(email_verified)
  WHERE email_verified = false;

-- Commentaire explicatif
COMMENT ON COLUMN public.users.email_verified IS 
'Indique si l''email a été vérifié après approbation admin. Bloque la connexion si false.';
