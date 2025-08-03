#!/bin/bash

# ===========================================
# SCRIPT DE DÉPLOIEMENT - API FOURNISSEUR CG
# ===========================================
# Usage: ./deploy.sh [production|staging]

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-staging}
PROJECT_ROOT=$(pwd)
DEPLOY_DIR="/var/www/adonisjs-apps/api-fournisseur"

# Configuration par environnement
if [ "$ENVIRONMENT" = "production" ]; then
    PORT=3333
    DOMAIN="api.fournisseur.cg"
    PM2_NAME="api-fournisseur-prod"
    ENV_FILE="env.production.example"
    echo -e "${GREEN}🚀 Déploiement en PRODUCTION${NC}"
elif [ "$ENVIRONMENT" = "staging" ]; then
    PORT=3334
    DOMAIN="staging-api.fournisseur.cg"
    PM2_NAME="api-fournisseur-staging"
    ENV_FILE="env.staging.example"
    echo -e "${YELLOW}🧪 Déploiement en STAGING${NC}"
else
    echo -e "${RED}❌ Environnement invalide. Utilisez: production ou staging${NC}"
    exit 1
fi

echo "=================================="
echo "📦 Environnement: $ENVIRONMENT"
echo "🌐 Port: $PORT"
echo "🔗 Domaine: $DOMAIN"
echo "⚙️  PM2 Name: $PM2_NAME"
echo "=================================="

# Fonction pour afficher les étapes
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

# Fonction pour vérifier le succès
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Étape 1: Vérifications préliminaires
print_step "Vérifications préliminaires"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Fichier package.json non trouvé. Êtes-vous dans le bon répertoire ?${NC}"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Fichier $ENV_FILE non trouvé.${NC}"
    exit 1
fi

check_success "Vérifications préliminaires terminées"

# Étape 2: Installation des dépendances
print_step "Installation des dépendances"
pnpm install --frozen-lockfile
check_success "Dépendances installées"

# Étape 3: Build de l'application
print_step "Build de l'application"
pnpm run build
check_success "Build terminé"

# Étape 4: Création du répertoire de déploiement
print_step "Préparation du répertoire de déploiement"
sudo mkdir -p "$DEPLOY_DIR"
sudo chown -R $USER:$USER "$DEPLOY_DIR"
check_success "Répertoire de déploiement préparé"

# Étape 5: Copie des fichiers
print_step "Copie des fichiers de build"
cp -r build/* "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp pnpm-lock.yaml "$DEPLOY_DIR/"
check_success "Fichiers copiés"

# Étape 6: Copie de la configuration d'environnement
print_step "Configuration de l'environnement $ENVIRONMENT"
cp "$ENV_FILE" "$DEPLOY_DIR/.env"
check_success "Configuration d'environnement copiée"

# Étape 7: Installation des dépendances de production
print_step "Installation des dépendances de production"
cd "$DEPLOY_DIR"
pnpm install --frozen-lockfile --prod
check_success "Dépendances de production installées"

# Étape 8: Configuration PM2
print_step "Configuration PM2"
cat > "$DEPLOY_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: '$PM2_NAME',
      script: './bin/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: '$ENVIRONMENT',
        PORT: $PORT,
        HOST: '0.0.0.0'
      },
      error_file: '/var/log/pm2/$PM2_NAME-error.log',
      out_file: '/var/log/pm2/$PM2_NAME-out.log',
      log_file: '/var/log/pm2/$PM2_NAME-combined.log',
      time: true
    }
  ]
}
EOF

check_success "Configuration PM2 créée"

# Étape 9: Redémarrage de l'application avec PM2
print_step "Redémarrage de l'application"

# Arrêter l'ancienne version si elle existe
pm2 stop "$PM2_NAME" 2>/dev/null || true
pm2 delete "$PM2_NAME" 2>/dev/null || true

# Démarrer la nouvelle version
pm2 start ecosystem.config.js
pm2 save
check_success "Application redémarrée avec PM2"

# Étape 10: Vérification du statut
print_step "Vérification du statut"
sleep 5
pm2 status "$PM2_NAME"

# Test de connectivité local
echo -e "\n${BLUE}🔍 Test de connectivité...${NC}"
if curl -f -s "http://localhost:$PORT" > /dev/null; then
    echo -e "${GREEN}✅ Application accessible sur le port $PORT${NC}"
else
    echo -e "${RED}❌ Application non accessible sur le port $PORT${NC}"
    echo -e "${YELLOW}📋 Vérifiez les logs: pm2 logs $PM2_NAME${NC}"
fi

# Étape 11: Affichage des informations de déploiement
print_step "Informations de déploiement"
echo "=================================="
echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
echo ""
echo "📋 Informations:"
echo "   • Environnement: $ENVIRONMENT"
echo "   • Port local: $PORT"
echo "   • PM2 Name: $PM2_NAME"
echo "   • Répertoire: $DEPLOY_DIR"
echo ""
echo "🔗 URLs:"
echo "   • Local: http://localhost:$PORT"
echo "   • Public: https://$DOMAIN"
echo "   • Documentation: https://$DOMAIN/docs"
echo "   • Health: https://$DOMAIN/v3"
echo ""
echo "⚙️  Commandes utiles:"
echo "   • Logs: pm2 logs $PM2_NAME"
echo "   • Status: pm2 status $PM2_NAME"
echo "   • Restart: pm2 restart $PM2_NAME"
echo "   • Stop: pm2 stop $PM2_NAME"
echo ""
echo "📁 Prochaines étapes:"
echo "   1. Vérifiez que Nginx pointe vers le port $PORT"
echo "   2. Vérifiez que Traefik route vers $DOMAIN"
echo "   3. Testez l'API via $DOMAIN"
echo "=================================="

cd "$PROJECT_ROOT"
