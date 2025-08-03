itoua@srv737568:/var/www/adonisjs-apps$ git clone https://github.com/Justany/api.fournisseur.cg.git api-fournisseur
cd api-fournisseur
Cloning into 'api-fournisseur'...
remote: Enumerating objects: 351, done.
remote: Counting objects: 100% (351/351), done.
remote: Compressing objects: 100% (191/191), done.
remote: Total 351 (delta 210), reused 291 (delta 150), pack-reused 0 (from 0)
Receiving objects: 100% (351/351), 249.12 KiB | 3.95 MiB/s, done.
Resolving deltas: 100% (210/210), done.
itoua@srv737568:/var/www/adonisjs-apps/api-fournisseur$ git pull
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 1), reused 3 (delta 1), pack-reused 0 (from 0)
Unpacking objects: 100% (3/3), 1.67 KiB | 1.67 MiB/s, done.
From https://github.com/Justany/api.fournisseur.cg
   e4c1702..378da6b  main       -> origin/main
Updating e4c1702..378da6b
Fast-forward
 .env.example | 39 +++++++++++++++++++++++++++------------
 1 file changed, 27 insertions(+), 12 deletions(-)
itoua@srv737568:/var/www/adonisjs-apps/api-fournisseur$ /var/www/adonisjs-apps/deploy-adonisjs.sh api-fournisseur 3333 api.fournisseur.cg
🚀 Déploiement de l'application AdonisJS: api-fournisseur
📂 Dossier: /var/www/adonisjs-apps/api-fournisseur
🌐 Port: 3333
🔗 Domaine: api.fournisseur.cg
📦 Installation des dépendances avec pnpm...
Lockfile is up to date, resolution step is skipped
Packages: +610
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Downloading typescript@3.9.10: 9.58 MB/9.58 MB, done
Downloading @swc/core-linux-x64-gnu@1.11.24: 14.10 MB/14.10 MB, done
Downloading @swc/core-linux-x64-musl@1.11.24: 19.77 MB/19.77 MB, done
Progress: resolved 610, reused 35, downloaded 575, added 610, done
node_modules/.pnpm/@swc+core@1.11.24/node_modules/@swc/core: Running postinstall script, done in 87ms

dependencies:
+ @adonisjs/auth 9.4.2
+ @adonisjs/core 6.19.0
+ @adonisjs/cors 2.2.1
+ @adonisjs/lucid 21.8.0
+ @types/js-yaml 4.0.9
+ @types/node-fetch 2.6.13
+ @vinejs/vine 3.0.1
+ adonis-autoswagger 3.73.0
+ js-yaml 4.1.0
+ luxon 3.7.1
+ node-appwrite 17.2.0
+ node-fetch 2.7.0
+ pg 8.16.3
+ reflect-metadata 0.2.2

devDependencies:
+ @adonisjs/assembler 7.8.2
+ @adonisjs/eslint-config 2.1.0
+ @adonisjs/prettier-config 1.4.5
+ @adonisjs/tsconfig 1.4.1
+ @japa/api-client 3.1.0
+ @japa/assert 4.1.1
+ @japa/plugin-adonisjs 4.0.0
+ @japa/runner 4.3.0
+ @swc/core 1.11.24
+ @types/luxon 3.7.1
+ @types/node 22.17.0
+ eslint 9.32.0
+ hot-hook 0.4.0
+ pino-pretty 13.1.1
+ prettier 3.6.2
+ ts-node-maintained 10.9.6
+ typescript 5.8.3

Done in 7.7s using pnpm v10.13.1
🏗️ Construction de l'application...

> api.fournisseur.cg@0.0.0 build /var/www/adonisjs-apps/api-fournisseur
> node ace build

[ info ] cleaning up output directory (build)
[ info ] compiling typescript source (tsc)
[ info ] rewrited ace file (build/ace.js)
[ info ] copying meta files to the output directory
[ success ] build completed

╭────────────────────────────────────────────────────────────────────────╮
│    Run the following commands to start the server in production        │
│────────────────────────────────────────────────────────────────────────│
│                                                                        │
│    ❯ cd build                                                          │
│    ❯ pnpm i --prod                                                     │
│    ❯ node bin/server.js                                                │
│                                                                        │
╰────────────────────────────────────────────────────────────────────────╯
🌐 Configuration Nginx...
[sudo] password for itoua:
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
🔧 Configuration PM2...
🚀 Démarrage de l'application avec PM2...
[PM2][WARN] Applications api-fournisseur not running, starting...
[PM2] App [api-fournisseur] launched (1 instances)
┌────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name               │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ api-fournisseur    │ default     │ 0.0.0   │ cluster │ 2999895  │ 0s     │ 0    │ online    │ 0%       │ 52.1mb   │ itoua    │ disabled │
└────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
[PM2] Saving current process list...
[PM2] Successfully saved in /home/itoua/.pm2/dump.pm2
🔄 Rechargement Nginx...
🌐 Configuration Traefik...
📝 Ajoutez ces labels à votre configuration Traefik:

  api-fournisseur:
    image: nginx:alpine
    container_name: api-fournisseur-nginx
    restart: unless-stopped
    networks:
      - traefik_spaarkcloud
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik_spaarkcloud
      - "traefik.http.routers.api-fournisseur.rule=Host(\`api.fournisseur.cg\`)"
      - "traefik.http.routers.api-fournisseur.entrypoints=websecure"
      - "traefik.http.routers.api-fournisseur.tls=true"
      - "traefik.http.services.api-fournisseur.loadbalancer.server.port=8080"

✅ Déploiement terminé!
🔗 L'application devrait être accessible via: https://api.fournisseur.cg

📋 Commandes utiles:
  pm2 status
  pm2 logs api-fournisseur
  pm2 restart api-fournisseur
  pm2 stop api-fournisseur


  ---

🌐 Configuration Traefik...
📝 Ajoutez ces labels à votre configuration Traefik:

  api-fournisseur:
    image: nginx:alpine
    container_name: api-fournisseur-nginx
    restart: unless-stopped
    networks:
      - traefik_spaarkcloud
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik_spaarkcloud
      - "traefik.http.routers.api-fournisseur.rule=Host(\`api.fournisseur.cg\`)"
      - "traefik.http.routers.api-fournisseur.entrypoints=websecure"
      - "traefik.http.routers.api-fournisseur.tls=true"
      - "traefik.http.services.api-fournisseur.loadbalancer.server.port=8080"

✅ Déploiement terminé!
🔗 L'application devrait être accessible via: https://api.fournisseur.cg
