# 🚀 Guide de Déploiement - API Fournisseur CG

## 📋 Configurations Disponibles

### 🔴 **Production** (Port 3333)
- **Domaine** : `https://api.arkelys.cloud`
- **Port** : `3333`
- **PM2 Name** : `api-fournisseur-prod`
- **Configuration** : `env.production.example`

### 🟡 **Staging** (Port 3334)
- **Domaine** : `https://staging-api.arkelys.cloud`
- **Port** : `3334`
- **PM2 Name** : `api-fournisseur-staging`
- **Configuration** : `env.staging.example`

## 🛠️ Préparation Initiale

### 1. Configurer les Variables d'Environnement

```bash
# Copier et personnaliser pour la production
cp env.production.example .env.production
nano .env.production

# Copier et personnaliser pour le staging
cp env.staging.example .env.staging
nano .env.staging
```

### 2. Personnaliser les Configurations

**Variables importantes à modifier :**

- `APP_KEY` : Clé unique pour chaque environnement
- `APPWRITE_PROJECT_ID` : ID du projet Appwrite
- `APPWRITE_API_KEY` : Clé API Appwrite
- `SPAARK_PAY_LIVE_API_KEY` : Clé live pour la production uniquement
- `SMS_API_KEY` : Clé SMS API
- `MAILERSEND_API_KEY` : Clé MailerSend

## 🚀 Déploiement

### Déploiement Automatique

```bash
# Déploiement en staging
./deploy.sh staging

# Déploiement en production
./deploy.sh production
```

### Déploiement Manuel

```bash
# 1. Build
pnpm run build

# 2. Copier les fichiers
sudo cp -r build/* /var/www/adonisjs-apps/api-fournisseur/
sudo cp package.json /var/www/adonisjs-apps/api-fournisseur/

# 3. Copier la configuration d'environnement
sudo cp env.production.example /var/www/adonisjs-apps/api-fournisseur/.env

# 4. Installer les dépendances
cd /var/www/adonisjs-apps/api-fournisseur
pnpm install --frozen-lockfile --prod

# 5. Redémarrer PM2
pm2 restart api-fournisseur-prod
```

## 🔧 Configuration Nginx

### Configuration Production (Port 3333)

```nginx
# /etc/nginx/sites-available/api-fournisseur-prod
server {
    listen 8080;
    server_name api.arkelys.cloud;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/api_fournisseur_prod_access.log;
    error_log /var/log/nginx/api_fournisseur_prod_error.log;
}
```

### Configuration Staging (Port 3334)

```nginx
# /etc/nginx/sites-available/api-fournisseur-staging
server {
    listen 8081;
    server_name staging-api.arkelys.cloud;

    location / {
        proxy_pass http://localhost:3334;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/api_fournisseur_staging_access.log;
    error_log /var/log/nginx/api_fournisseur_staging_error.log;
}
```

## 🐳 Configuration Docker/Traefik

### Production Container

```yaml
# À ajouter dans docker-compose.yml
api-fournisseur-prod-nginx:
  image: nginx:alpine
  container_name: api-fournisseur-prod-nginx
  restart: unless-stopped
  volumes:
    - /etc/nginx/sites-available/api-fournisseur-prod:/etc/nginx/conf.d/default.conf
  networks:
    - traefik_spaarkcloud
  labels:
    - traefik.enable=true
    - traefik.docker.network=traefik_spaarkcloud
    - "traefik.http.routers.api-fournisseur-prod.rule=Host(`api.arkelys.cloud`)"
    - "traefik.http.routers.api-fournisseur-prod.entrypoints=websecure"
    - "traefik.http.routers.api-fournisseur-prod.tls=true"
    - "traefik.http.services.api-fournisseur-prod.loadbalancer.server.port=8080"
```

### Staging Container

```yaml
# À ajouter dans docker-compose.yml
api-fournisseur-staging-nginx:
  image: nginx:alpine
  container_name: api-fournisseur-staging-nginx
  restart: unless-stopped
  volumes:
    - /etc/nginx/sites-available/api-fournisseur-staging:/etc/nginx/conf.d/default.conf
  networks:
    - traefik_spaarkcloud
  labels:
    - traefik.enable=true
    - traefik.docker.network=traefik_spaarkcloud
    - "traefik.http.routers.api-fournisseur-staging.rule=Host(`staging-api.arkelys.cloud`)"
    - "traefik.http.routers.api-fournisseur-staging.entrypoints=websecure"
    - "traefik.http.routers.api-fournisseur-staging.tls=true"
    - "traefik.http.services.api-fournisseur-staging.loadbalancer.server.port=8081"
```

## 🔍 Monitoring et Debug

### Commandes PM2

```bash
# Voir le statut
pm2 status

# Logs spécifiques
pm2 logs api-fournisseur-prod
pm2 logs api-fournisseur-staging

# Redémarrer
pm2 restart api-fournisseur-prod
pm2 restart api-fournisseur-staging

# Monitoring temps réel
pm2 monit
```

### Tests de Connectivité

```bash
# Test local production
curl http://localhost:3333/v3

# Test local staging
curl http://localhost:3334/v3

# Test via Nginx production
curl http://localhost:8080/v3

# Test via Nginx staging
curl http://localhost:8081/v3

# Test public production
curl https://api.arkelys.cloud/v3

# Test public staging
curl https://staging-api.arkelys.cloud/v3
```

### Logs Utiles

```bash
# Logs de l'application
tail -f /var/log/pm2/api-fournisseur-prod-combined.log
tail -f /var/log/pm2/api-fournisseur-staging-combined.log

# Logs Nginx
tail -f /var/log/nginx/api_fournisseur_prod_access.log
tail -f /var/log/nginx/api_fournisseur_staging_access.log
tail -f /var/log/nginx/api_fournisseur_prod_error.log
tail -f /var/log/nginx/api_fournisseur_staging_error.log

# Logs Traefik
cd /home/itoua/spaarkcloud
docker compose logs -f traefik
```

## 🔄 Workflow de Déploiement Recommandé

### 1. Développement Local
```bash
# Tests en local
pnpm run dev
```

### 2. Déploiement Staging
```bash
# Déployer en staging pour tests
./deploy.sh staging

# Tester l'API staging
curl https://staging-api.arkelys.cloud/v3
```

### 3. Déploiement Production
```bash
# Une fois validé en staging
./deploy.sh production

# Vérifier la production
curl https://api.arkelys.cloud/v3
```

## 🆘 Dépannage

### Application ne démarre pas
```bash
# Vérifier les logs PM2
pm2 logs api-fournisseur-prod

# Vérifier la configuration
cat /var/www/adonisjs-apps/api-fournisseur/.env

# Redémarrer
pm2 restart api-fournisseur-prod
```

### Erreur 502 Bad Gateway
```bash
# Vérifier que l'app tourne
pm2 status api-fournisseur-prod

# Vérifier la config Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### SSL/Domaine ne fonctionne pas
```bash
# Vérifier Traefik
cd /home/itoua/spaarkcloud
docker compose logs traefik

# Redémarrer Traefik
docker compose restart traefik
```

---

✅ **Votre API est maintenant configurée pour des déploiements multi-environnements !**
