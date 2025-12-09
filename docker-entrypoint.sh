#!/bin/bash
set -e

# Script d'entrée pour le container server
# Applique les migrations avant de démarrer l'application

echo "🚀 Démarrage du serveur Logi Clinic..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
until pg_isready -h ${POSTGRES_HOST:-postgres} -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-logi_clinic} > /dev/null 2>&1; do
  echo "⏳ PostgreSQL n'est pas encore prêt, attente..."
  sleep 2
done

echo "✅ PostgreSQL est prêt!"

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Appliquer les migrations Prisma
echo "📊 Application des migrations Prisma..."
npx prisma migrate deploy || {
  echo "⚠️  Certaines migrations Prisma ont peut-être déjà été appliquées"
}

echo "✅ Migrations Prisma appliquées!"

# Information sur les migrations Supabase
if [ -d "/workspace/supabase_migrations" ] || [ -d "../supabase_migrations" ]; then
  echo ""
  echo "📝 Note: Les migrations Supabase doivent être appliquées séparément"
  echo "   Voir APPLIQUER_MIGRATIONS.md pour les instructions"
  echo ""
fi

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
exec "$@"

