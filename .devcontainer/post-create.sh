#!/bin/bash
set -e

echo "🚀 Configuration de l'environnement de développement..."

# Installer les dépendances du serveur
if [ -d "server" ]; then
  echo "📦 Installation des dépendances du serveur..."
  cd server
  npm install
  cd ..
fi

# Installer les dépendances du client
if [ -d "client" ]; then
  echo "📦 Installation des dépendances du client..."
  cd client
  npm install
  cd ..
fi

# Générer le client Prisma
if [ -d "server/prisma" ]; then
  echo "🔧 Génération du client Prisma..."
  cd server
  npx prisma generate
  cd ..
fi

echo "✅ Configuration terminée!"
