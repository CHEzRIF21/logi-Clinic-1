FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    git \
    bash \
    curl \
    postgresql-client

# Créer un utilisateur non-root
RUN addgroup -g 1000 node && \
    adduser -u 1000 -G node -s /bin/bash -D node

# Définir le répertoire de travail
WORKDIR /workspace

# Copier les fichiers de configuration package.json pour installer les dépendances
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Installer les dépendances globales et locales
RUN npm install -g prisma@latest

# Changer le propriétaire
RUN chown -R node:node /workspace

USER node

# Exposer les ports
EXPOSE 3000 5173

