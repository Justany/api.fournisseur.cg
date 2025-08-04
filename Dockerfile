# ===========================================
# DOCKERFILE PRODUCTION - API FOURNISSEUR CG
# ===========================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Installer pnpm globalement
RUN npm install -g pnpm

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des packages
COPY package.json pnpm-lock.yaml ./

# Installer toutes les dépendances (dev + prod) pour le build
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build l'application en utilisant le script défini dans package.json
# Note: Le script "build" dans package.json utilise "npm run" mais on adapte pour pnpm
RUN pnpm run clean && node ace build && pnpm run copy-docs

# Stage 2: Production Runtime
FROM node:20-alpine AS runtime

# Installer pnpm globalement
RUN npm install -g pnpm

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des packages
COPY package.json pnpm-lock.yaml ./

# Installer uniquement les dépendances de production
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Copier l'application buildée depuis le stage builder
COPY --from=builder --chown=adonisjs:nodejs /app/build ./build

# Copier les node_modules pour la production
COPY --from=builder --chown=adonisjs:nodejs /app/node_modules ./node_modules

# Définir les variables d'environnement de production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Changer vers l'utilisateur non-root
USER adonisjs

# Exposer le port
EXPOSE 3333

# Définir le répertoire de travail correct
WORKDIR /app/build

# Script de démarrage avec migrations automatiques
COPY --chown=adonisjs:nodejs <<EOF /app/start.sh
#!/bin/sh
echo "🔄 Exécution des migrations PostgreSQL..."
node ace migration:run --force

echo "🚀 Démarrage de l'application..."
exec node bin/server.js
EOF

# Rendre le script exécutable
RUN chmod +x /app/start.sh

# Démarrer avec le script qui inclut les migrations
CMD ["/app/start.sh"]

# Commentaire : ./fix-api-labels.sh à exécuter sur le serveur KVM1
