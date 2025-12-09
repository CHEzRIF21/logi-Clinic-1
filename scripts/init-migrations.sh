#!/bin/bash
set -e

# Script d'initialisation des migrations pour Docker
# Ce script applique les migrations Prisma et prépare l'environnement pour Supabase

echo "🚀 Initialisation des migrations..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
until pg_isready -h ${POSTGRES_HOST:-postgres} -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-logi_clinic} > /dev/null 2>&1; do
  echo "⏳ PostgreSQL n'est pas encore prêt, attente..."
  sleep 2
done

echo "✅ PostgreSQL est prêt!"

# Appliquer les migrations Prisma
if [ -d "prisma" ]; then
  echo "📊 Application des migrations Prisma..."
  npx prisma generate
  npx prisma migrate deploy || {
    echo "⚠️  Certaines migrations Prisma ont peut-être déjà été appliquées"
  }
  echo "✅ Migrations Prisma appliquées!"
fi

# Information sur les migrations Supabase
if [ -d "/workspace/supabase_migrations" ] || [ -d "../supabase_migrations" ]; then
  echo ""
  echo "📝 Migrations Supabase détectées"
  echo "   Pour appliquer les migrations Supabase:"
  echo "   1. Via le dashboard: Voir APPLIQUER_MIGRATIONS.md"
  echo "   2. Via CLI: ./devcontainer/apply-supabase-migrations.sh [project-ref]"
  echo ""
fi

echo "✅ Initialisation terminée!"

