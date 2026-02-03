-- ============================================
-- Vérification et correction clinic_id sur registration_requests
-- ============================================
-- Objectif (multi-tenant, générique) :
-- 1. Vérifier pour TOUTES les cliniques que les demandes d'inscription ont un clinic_id
--    correspondant au clinic_code (via la table clinics).
-- 2. Corriger automatiquement les lignes où clinic_id est NULL ou ne correspond pas
--    au bon clinic_code (sans supposer un code en dur type ITA).
-- ============================================

-- ---------------------------------------------------------------------------
-- 1. VÉRIFICATION : demandes dont clinic_id ne correspond pas au clinic_code
-- ---------------------------------------------------------------------------
-- Vue (lecture seule) : liste des registration_requests avec le bon clinic_id
-- attendu et un indicateur de cohérence.
-- Exécuter en SELECT pour un diagnostic avant correction.

CREATE OR REPLACE VIEW public.v_registration_requests_clinic_check AS
SELECT
  r.id,
  r.email,
  r.statut,
  r.clinic_code,
  r.clinic_id AS clinic_id_actuel,
  c.id AS clinic_id_attendu,
  c.code AS clinic_code_clinics,
  CASE
    WHEN c.id IS NULL THEN 'clinique_inexistante'
    WHEN r.clinic_id IS NULL THEN 'clinic_id_null'
    WHEN r.clinic_id <> c.id THEN 'clinic_id_incorrect'
    ELSE 'ok'
  END AS statut_coherence
FROM public.registration_requests r
LEFT JOIN public.clinics c
  ON UPPER(TRIM(c.code)) = UPPER(TRIM(NULLIF(r.clinic_code, '')))
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.v_registration_requests_clinic_check IS
  'Vérification clinic_id vs clinic_code pour toutes les cliniques. statut_coherence: ok | clinic_id_null | clinic_id_incorrect | clinique_inexistante.';

-- Requête générique de vérification (à exécuter pour lister les incohérences)
-- À lancer dans le SQL Editor Supabase pour toutes les cliniques :
/*
SELECT * FROM public.v_registration_requests_clinic_check
WHERE statut_coherence <> 'ok';
*/

-- ---------------------------------------------------------------------------
-- 2. CORRECTION : aligner clinic_id sur la clinique dont le code = clinic_code
-- ---------------------------------------------------------------------------
-- Met à jour toutes les demandes où :
-- - clinic_code est renseigné ET
-- - une clinique existe avec ce code ET
-- - (clinic_id est NULL OU clinic_id <> id de cette clinique)

UPDATE public.registration_requests r
SET clinic_id = c.id
FROM public.clinics c
WHERE UPPER(TRIM(c.code)) = UPPER(TRIM(NULLIF(r.clinic_code, '')))
  AND (r.clinic_id IS NULL OR r.clinic_id <> c.id);

-- Compte des lignes mises à jour (optionnel, pour log)
-- À exécuter avant/après pour comparer :
/*
SELECT COUNT(*) AS demandes_a_corriger
FROM public.v_registration_requests_clinic_check
WHERE statut_coherence IN ('clinic_id_null', 'clinic_id_incorrect');
*/

-- ---------------------------------------------------------------------------
-- 3. VÉRIFICATION POST-CORRECTION (toutes les cliniques)
-- ---------------------------------------------------------------------------
-- Après la correction, cette requête doit retourner 0 lignes pour les types
-- 'clinic_id_null' et 'clinic_id_incorrect' (les clinic_code sans clinique
-- correspondante restent en 'clinique_inexistante' jusqu'à création des cliniques).
/*
SELECT statut_coherence, COUNT(*) AS nb
FROM public.v_registration_requests_clinic_check
GROUP BY statut_coherence;
*/

-- ---------------------------------------------------------------------------
-- 4. RÉSUMÉ PAR CLINIQUE (clinic_code) — vérification pour toutes les cliniques
-- ---------------------------------------------------------------------------
-- Nombre de demandes par clinic_code et statut de cohérence (générique).
/*
SELECT
  clinic_code,
  clinic_id_attendu,
  clinic_id_actuel,
  statut_coherence,
  COUNT(*) AS nb_demandes
FROM public.v_registration_requests_clinic_check
GROUP BY clinic_code, clinic_id_attendu, clinic_id_actuel, statut_coherence
ORDER BY clinic_code, statut_coherence;
*/
