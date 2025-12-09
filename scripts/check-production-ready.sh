#!/bin/bash

# Script de vérification de préparation à la production
# Usage: ./scripts/check-production-ready.sh

echo "🔍 Vérification de préparation à la production - Logi Clinic"
echo "============================================================"
echo ""

ERRORS=0
WARNINGS=0

# Vérifier Node.js
echo "📦 Vérification Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  ✅ Node.js installé: $NODE_VERSION"
else
    echo "  ❌ Node.js non installé"
    ((ERRORS++))
fi

# Vérifier npm
echo "📦 Vérification npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "  ✅ npm installé: $NPM_VERSION"
else
    echo "  ❌ npm non installé"
    ((ERRORS++))
fi

# Vérifier le fichier .env.production
echo "📝 Vérification variables d'environnement..."
if [ -f ".env.production" ]; then
    echo "  ✅ Fichier .env.production trouvé"
    
    # Vérifier les variables essentielles
    if grep -q "VITE_SUPABASE_URL=https://" .env.production && ! grep -q "votre-projet.supabase.co" .env.production; then
        echo "  ✅ VITE_SUPABASE_URL configuré"
    else
        echo "  ⚠️  VITE_SUPABASE_URL non configuré ou utilise une valeur placeholder"
        ((WARNINGS++))
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env.production && ! grep -q "votre-anon-key-ici" .env.production; then
        echo "  ✅ VITE_SUPABASE_ANON_KEY configuré"
    else
        echo "  ⚠️  VITE_SUPABASE_ANON_KEY non configuré ou utilise une valeur placeholder"
        ((WARNINGS++))
    fi
else
    echo "  ⚠️  Fichier .env.production non trouvé (optionnel mais recommandé)"
    ((WARNINGS++))
fi

# Vérifier que .env.production n'est pas dans git
echo "🔒 Vérification sécurité..."
if grep -q ".env.production" .gitignore 2>/dev/null; then
    echo "  ✅ .env.production dans .gitignore"
else
    echo "  ⚠️  .env.production pas dans .gitignore (risque de sécurité)"
    ((WARNINGS++))
fi

# Vérifier les migrations
echo "🗄️  Vérification migrations Supabase..."
if [ -d "supabase_migrations" ]; then
    MIGRATION_COUNT=$(find supabase_migrations -name "*.sql" | wc -l)
    echo "  ✅ $MIGRATION_COUNT fichiers de migration trouvés"
    
    if [ -f "supabase_migrations/apply_all_migrations_and_rls.sql" ]; then
        echo "  ✅ Script de migration consolidé trouvé"
    else
        echo "  ⚠️  Script de migration consolidé non trouvé"
        ((WARNINGS++))
    fi
else
    echo "  ❌ Dossier supabase_migrations non trouvé"
    ((ERRORS++))
fi

# Vérifier le build
echo "🔨 Test de build..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Build réussi"
    
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        echo "  ✅ Dossier build créé (taille: $BUILD_SIZE)"
    else
        echo "  ❌ Dossier build non créé"
        ((ERRORS++))
    fi
else
    echo "  ❌ Build échoué (exécutez 'npm run build' pour voir les erreurs)"
    ((ERRORS++))
fi

# Vérifier les dépendances
echo "📚 Vérification dépendances..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json trouvé"
    
    if [ -d "node_modules" ]; then
        echo "  ✅ node_modules trouvé"
    else
        echo "  ⚠️  node_modules non trouvé (exécutez 'npm install')"
        ((WARNINGS++))
    fi
else
    echo "  ❌ package.json non trouvé"
    ((ERRORS++))
fi

# Résumé
echo ""
echo "============================================================"
echo "📊 Résumé"
echo "============================================================"
echo "  ❌ Erreurs: $ERRORS"
echo "  ⚠️  Avertissements: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Tout est prêt pour la production !"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Prêt avec quelques avertissements"
    exit 0
else
    echo "❌ Des erreurs doivent être corrigées avant le déploiement"
    exit 1
fi

