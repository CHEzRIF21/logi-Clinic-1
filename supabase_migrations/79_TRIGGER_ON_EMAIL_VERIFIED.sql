-- ============================================
-- Trigger on_email_verified - Activation après vérification email
-- ============================================
-- Objectif:
-- - S'exécute quand email_verified passe de false à true sur public.users
-- - Assure actif=true et status=ACTIVE (cohérence avec l'API verify-email)
-- - Journalise l'événement via RAISE NOTICE
-- ============================================

CREATE OR REPLACE FUNCTION public.on_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seulement si email_verified passe de false à true
  IF (OLD.email_verified IS NULL OR OLD.email_verified = false) AND NEW.email_verified = true THEN
    -- Assurer que le compte est activé
    NEW.actif := true;
    NEW.status := 'ACTIVE';
    NEW.updated_at := NOW();

    -- Log de l'activation (visible dans les logs Supabase)
    RAISE NOTICE 'Compte activé après vérification email: % (user_id: %)', NEW.email, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existait déjà (idempotence)
DROP TRIGGER IF EXISTS trigger_on_email_verified ON public.users;

CREATE TRIGGER trigger_on_email_verified
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.email_verified IS DISTINCT FROM NEW.email_verified)
  EXECUTE FUNCTION public.on_email_verified();

COMMENT ON FUNCTION public.on_email_verified() IS
'Trigger: finalise l''activation du compte (actif=true, status=ACTIVE) lorsque email_verified passe à true.';
