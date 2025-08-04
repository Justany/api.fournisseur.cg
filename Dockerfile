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
COPY --from=builder --chown=adonisjs:nodejs /app/build ./

# Copier les node_modules nécessaires depuis le builder (pour éviter les problèmes de dépendances)
COPY --from=builder --chown=adonisjs:nodejs /app/node_modules ./node_modules

# Définir les variables d'environnement de production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Changer vers l'utilisateur non-root
USER adonisjs

# Exposer le port
EXPOSE 3333

# Health check amélioré pour AdonisJS
# HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
#   CMD node -e "const http = require('http'); \
#     const options = { host: '0.0.0.0', port: 3333, timeout: 5000 }; \
#     const req = http.request(options, (res) => { \
#       console.log('Health check status:', res.statusCode); \
#       process.exit(res.statusCode === 200 ? 0 : 1); \
#     }); \
#     req.on('error', (err) => { \
#       console.error('Health check failed:', err); \
#       process.exit(1); \
#     }); \
#     req.end();"

# Démarrer l'application (utilise le script start du package.json)
CMD ["node", "./bin/server.js"]
