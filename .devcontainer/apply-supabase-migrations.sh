#!/bin/bash
set -e

# Script pour appliquer les migrations Supabase dans Docker
# Usage: ./apply-supabase-migrations.sh [project-ref]

PROJECT_REF=${1:-$SUPABASE_PROJECT_ID}
MIGRATIONS_DIR="supabase_migrations"

echo "🔷 Application des migrations Supabase..."

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Le répertoire $MIGRATIONS_DIR n'existe pas!"
  exit 1
fi

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI n'est pas installé!"
  echo "📦 Installation de Supabase CLI..."
  npm install -g supabase
fi

# Initialiser Supabase si nécessaire
if [ ! -f ".supabase/config.toml" ]; then
  echo "🔧 Initialisation de Supabase..."
  supabase init
fi

# Lier au projet si PROJECT_REF est fourni
if [ ! -z "$PROJECT_REF" ]; then
  echo "🔗 Liaison au projet Supabase: $PROJECT_REF"
  supabase link --project-ref "$PROJECT_REF" || {
    echo "⚠️  Échec de la liaison. Vérifiez votre token Supabase:"
    echo "   supabase login"
    exit 1
  }
fi

# Appliquer les migrations
echo "📤 Application des migrations depuis $MIGRATIONS_DIR..."
supabase db push || {
  echo "⚠️  Échec de l'application des migrations via CLI."
  echo "📝 Alternative: Appliquez les migrations manuellement via le dashboard Supabase"
  echo "   Voir APPLIQUER_MIGRATIONS.md pour les instructions"
  exit 1
}

echo "✅ Migrations Supabase appliquées avec succès!"

