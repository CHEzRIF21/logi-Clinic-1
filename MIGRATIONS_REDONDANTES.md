# Migrations SQL Redondantes

Ce document liste les migrations qui peuvent être supprimées **APRÈS** avoir appliqué la migration consolidée `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`.

## ⚠️ ATTENTION IMPORTANTE

**NE SUPPRIMEZ CES MIGRATIONS QUE SI:**
1. ✅ La migration `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql` a été appliquée avec succès
2. ✅ Vous avez vérifié que CLINIC001 et CAMPUS-001 existent et fonctionnent correctement
3. ✅ Vous avez testé les connexions (voir `GUIDE_TEST_CONNEXIONS.md`)
4. ✅ Vous avez une sauvegarde de votre base de données

## 📋 Migrations à Supprimer

Ces migrations créent/modifient CLINIC001 et CAMPUS-001 et sont remplacées par la migration consolidée:

### Migrations de Configuration des Cliniques (12-27)

| Fichier | Description | Raison |
|---------|-------------|--------|
| `12_RESET_CAMPUS001_NO_CODE_CHANGE.sql` | Réinitialise CAMPUS-001 | Remplacé par migration consolidée |
| `13_RESET_ALL_CLINICS_EXCEPT_DEMO.sql` | Réinitialise toutes les cliniques sauf démo | Remplacé par migration consolidée |
| `14_CREATE_OR_VERIFY_CLINIC001_DEMO.sql` | Crée/vérifie CLINIC001 | Remplacé par migration consolidée |
| `15_COMPLETE_MULTI_TENANCY_SETUP.sql` | Configuration multi-tenant | Remplacé par migration consolidée |
| `16_COMPLETE_MULTI_TENANCY_IMPLEMENTATION.sql` | Implémentation multi-tenant | Remplacé par migration consolidée |
| `17_TEST_ETANCHEITE_MULTI_TENANCY.sql` | Tests d'étanchéité | Migration de test, peut être supprimée |
| `18_FIX_CAMPUS001_CONNECTION.sql` | Corrige la connexion CAMPUS-001 | Remplacé par migration consolidée |
| `19_CREATE_CAMPUS001_USER_AUTH.sql` | Crée l'utilisateur auth CAMPUS-001 | Remplacé par migration consolidée |
| `20_VERIFY_RPC_FUNCTION.sql` | Vérifie les fonctions RPC | Migration de vérification, peut être supprimée |
| `21_FIX_RPC_FUNCTION_TYPES.sql` | Corrige les types de fonctions RPC | Migration de correction, peut être supprimée |
| `22_FIX_DATA_ISOLATION_CAMPUS001.sql` | Corrige l'isolation des données | Remplacé par migration consolidée |
| `23_FIX_ALL_ISSUES.sql` | Corrige tous les problèmes | Remplacé par migration consolidée |
| `24_COMPLETE_MULTI_TENANT_ARCHITECTURE.sql` | Architecture multi-tenant complète | Remplacé par migration consolidée |
| `25_FIX_CLINIC_CODE_VALIDATION.sql` | Corrige la validation du code clinique | Migration de correction, peut être supprimée |
| `26_CREATE_CLINIC_CLIN_2025_001.sql` | Crée la clinique CLIN-2025-001 | **À supprimer** (clinique non nécessaire) |
| `27_RESET_COMPLETE_CLINIQUES_NON_DEMO.sql` | Réinitialise les cliniques non démo | Remplacé par migration consolidée |

### Migrations Anciennes (00-11)

Ces migrations peuvent être conservées si elles contiennent des configurations importantes (tables, RLS, etc.) qui ne sont pas dans la migration consolidée:

| Fichier | Description | Action |
|---------|-------------|--------|
| `00_MIGRATION_HIERARCHIQUE_COMPLETE.sql` | Migration hiérarchique complète | **Conserver** (structure de base) |
| `01_INSERTION_UTILISATEURS.sql` | Insertion d'utilisateurs | **Vérifier** si contient des utilisateurs autres que CLINIC001/CAMPUS-001 |
| `02_VERIFICATION_SETUP.sql` | Vérification du setup | **Supprimer** (migration de vérification) |
| `03_VERIFIER_LIEN_AUTH_USERS.sql` | Vérifie les liens auth | **Supprimer** (migration de vérification) |
| `04_DIAGNOSTIC_CLINIQUE.sql` | Diagnostic clinique | **Conserver** (peut contenir des tables) |
| `05_FIX_USERS_AND_CLINIC_CAMPUS.sql` | Corrige users et clinic campus | **Supprimer** (remplacé par migration consolidée) |
| `06_TEMPORARY_CLINIC_CODES.sql` | Codes temporaires de cliniques | **Supprimer** (codes temporaires non utilisés) |
| `07_VERIFY_AND_FIX_CAMPUS001.sql` | Vérifie et corrige CAMPUS-001 | **Supprimer** (remplacé par migration consolidée) |
| `08_FIX_RLS_TEMP_CODES.sql` | Corrige RLS pour codes temporaires | **Vérifier** si RLS est encore nécessaire |
| `09_FIX_RLS_CLINICS_PUBLIC_READ.sql` | Corrige RLS pour lecture publique | **Conserver** (RLS important) |
| `10_FUNCTION_GET_CLINIC_BY_TEMP_CODE.sql` | Fonction pour codes temporaires | **Supprimer** (codes temporaires non utilisés) |
| `11_FINAL_RLS_RECURSION_FIX.sql` | Correction finale RLS récursion | **Conserver** (RLS important) |

## 📝 Script de Suppression (Optionnel)

Si vous êtes sûr de vouloir supprimer ces migrations, vous pouvez utiliser ce script PowerShell:

```powershell
# Script pour supprimer les migrations redondantes
# ⚠️ ATTENTION: Exécutez seulement après avoir vérifié que tout fonctionne!

$migrationsToDelete = @(
    "12_RESET_CAMPUS001_NO_CODE_CHANGE.sql",
    "13_RESET_ALL_CLINICS_EXCEPT_DEMO.sql",
    "14_CREATE_OR_VERIFY_CLINIC001_DEMO.sql",
    "15_COMPLETE_MULTI_TENANCY_SETUP.sql",
    "16_COMPLETE_MULTI_TENANCY_IMPLEMENTATION.sql",
    "17_TEST_ETANCHEITE_MULTI_TENANCY.sql",
    "18_FIX_CAMPUS001_CONNECTION.sql",
    "19_CREATE_CAMPUS001_USER_AUTH.sql",
    "20_VERIFY_RPC_FUNCTION.sql",
    "21_FIX_RPC_FUNCTION_TYPES.sql",
    "22_FIX_DATA_ISOLATION_CAMPUS001.sql",
    "23_FIX_ALL_ISSUES.sql",
    "24_COMPLETE_MULTI_TENANT_ARCHITECTURE.sql",
    "25_FIX_CLINIC_CODE_VALIDATION.sql",
    "26_CREATE_CLINIC_CLIN_2025_001.sql",
    "27_RESET_COMPLETE_CLINIQUES_NON_DEMO.sql",
    "02_VERIFICATION_SETUP.sql",
    "03_VERIFIER_LIEN_AUTH_USERS.sql",
    "05_FIX_USERS_AND_CLINIC_CAMPUS.sql",
    "06_TEMPORARY_CLINIC_CODES.sql",
    "07_VERIFY_AND_FIX_CAMPUS001.sql",
    "10_FUNCTION_GET_CLINIC_BY_TEMP_CODE.sql"
)

$migrationDir = "supabase_migrations"

Write-Host "⚠️  ATTENTION: Cette action va supprimer $($migrationsToDelete.Count) migrations!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Êtes-vous sûr? (tapez 'SUPPRIMER' pour confirmer)"

if ($confirmation -ne "SUPPRIMER") {
    Write-Host "❌ Suppression annulée." -ForegroundColor Yellow
    exit 0
}

foreach ($migration in $migrationsToDelete) {
    $filePath = Join-Path $migrationDir $migration
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "✅ Supprimé: $migration" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Non trouvé: $migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Suppression terminée!" -ForegroundColor Green
```

## ✅ Checklist Avant Suppression

- [ ] Migration `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql` appliquée avec succès
- [ ] CLINIC001 existe et fonctionne
- [ ] CAMPUS-001 existe et fonctionne
- [ ] Connexions testées et fonctionnelles
- [ ] Isolation des données vérifiée
- [ ] Sauvegarde de la base de données effectuée
- [ ] Aucune autre clinique nécessaire

## 📊 Résumé

- **Migrations à supprimer**: ~22 fichiers
- **Migrations à conserver**: Migrations de structure (tables, RLS, etc.)
- **Migration consolidée**: `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`

## 🔄 Si Vous Avez Besoin de Restaurer

Si vous avez supprimé des migrations par erreur, vous pouvez:
1. Restaurer depuis votre sauvegarde Git
2. Ou réappliquer les migrations nécessaires depuis l'historique Git










