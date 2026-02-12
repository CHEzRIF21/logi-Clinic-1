-- ============================================
-- 104_FIX_ALI_WAGANA_ROLE_BY_UID.sql
-- Correction du rôle pour ALI WAGANA Islamiath (par UID Auth)
-- Application: LogiClinic - Multi-tenant
-- ============================================
-- Utilisateur: ALI WAGANA Islamiath
-- Email: islamiathaliwag@gmail.com
-- Auth UID: 19cf4d84-21f0-4e6e-ad23-95b0412dda87
--
-- Problème: Rôle affiché comme réceptionniste au lieu d'infirmière
-- Solution: Mise à jour directe par auth_user_id avec role = 'INFIRMIER'
--           (code standard reconnu par le frontend pour l'espace infirmier)
-- ============================================

DO $$
DECLARE
  v_auth_user_id  UUID := '19cf4d84-21f0-4e6e-ad23-95b0412dda87';
  v_updated       INT;
BEGIN
  -- Mise à jour de toutes les lignes public.users pour cet utilisateur
  UPDATE public.users
  SET
    role       = 'INFIRMIER',
    fonction   = 'Infirmière',
    full_name  = COALESCE(NULLIF(TRIM(full_name), ''), 'ALI WAGANA Islamiath'),
    nom        = COALESCE(NULLIF(TRIM(nom), ''), 'ALI WAGANA'),
    prenom     = COALESCE(NULLIF(TRIM(prenom), ''), 'Islamiath'),
    updated_at = NOW()
  WHERE auth_user_id = v_auth_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE NOTICE 'Aucune ligne public.users trouvée pour auth_user_id=%. Vérifiez que l''utilisateur existe.', v_auth_user_id;
  ELSE
    RAISE NOTICE 'Rôle corrigé: % ligne(s) mise(s) à jour pour auth_user_id=% → role=INFIRMIER, fonction=Infirmière.', v_updated, v_auth_user_id;
  END IF;
END $$;

-- Mise à jour des métadonnées auth.users (raw_user_meta_data) si utilisées par le JWT
DO $$
DECLARE
  v_auth_user_id  UUID := '19cf4d84-21f0-4e6e-ad23-95b0412dda87';
  v_meta          JSONB;
BEGIN
  SELECT raw_user_meta_data INTO v_meta
  FROM auth.users
  WHERE id = v_auth_user_id;

  IF v_meta IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"INFIRMIER"'
    )
    WHERE id = v_auth_user_id;
    RAISE NOTICE 'Métadonnées auth.users mises à jour (role=INFIRMIER) pour uid=%', v_auth_user_id;
  END IF;
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'Mise à jour auth.users ignorée (droits insuffisants ou table non accessible).';
END $$;
