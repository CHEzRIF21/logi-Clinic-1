-- ============================================
-- ADD auth_user_id to registration_requests
-- ============================================
-- Objectif:
-- - Relier une demande d'inscription au compte Supabase Auth créé lors de la soumission
-- - Permettre à l'admin d'approuver en "activant" le profil sans stocker le mot de passe
-- ============================================

DO $$
BEGIN
  -- Colonne auth_user_id (supabase auth.users.id)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registration_requests'
      AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.registration_requests
      ADD COLUMN auth_user_id UUID;
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_registration_requests_auth_user_id
  ON public.registration_requests(auth_user_id);

