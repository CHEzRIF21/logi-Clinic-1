#!/bin/bash
set -e

echo "🔄 Application des migrations..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
until pg_isready -h postgres -U postgres -d logi_clinic > /dev/null 2>&1; do
  echo "⏳ PostgreSQL n'est pas encore prêt, attente..."
  sleep 2
done

echo "✅ PostgreSQL est prêt!"

# Appliquer les migrations Prisma
if [ -d "server/prisma" ]; then
  echo "📊 Application des migrations Prisma..."
  cd server
  npx prisma migrate deploy || echo "⚠️  Certaines migrations Prisma ont peut-être déjà été appliquées"
  cd ..
fi

# Appliquer les migrations Supabase si Supabase CLI est disponible
if command -v supabase &> /dev/null; then
  echo "🔷 Application des migrations Supabase via CLI..."
  if [ -d "supabase_migrations" ]; then
    # Vérifier si Supabase est initialisé
    if [ ! -f ".supabase/config.toml" ]; then
      echo "⚠️  Supabase n'est pas initialisé. Initialisation..."
      supabase init
    fi
    
    # Lier au projet Supabase si SUPABASE_PROJECT_ID est défini
    if [ ! -z "$SUPABASE_PROJECT_ID" ]; then
      echo "🔗 Liaison au projet Supabase: $SUPABASE_PROJECT_ID"
      supabase link --project-ref "$SUPABASE_PROJECT_ID" || echo "⚠️  Échec de la liaison, continuons..."
    fi
    
    # Appliquer les migrations
    echo "📤 Application des migrations Supabase..."
    supabase db push || echo "⚠️  Les migrations Supabase doivent être appliquées manuellement via le dashboard"
  fi
else
  echo "ℹ️  Supabase CLI n'est pas installé."
  echo "📝 Pour appliquer les migrations Supabase:"
  echo "   1. Installez Supabase CLI: npm install -g supabase"
  echo "   2. Ou appliquez-les manuellement via le dashboard Supabase"
  echo "   3. Voir APPLIQUER_MIGRATIONS.md pour plus d'informations"
fi

echo "✅ Migrations terminées!"
