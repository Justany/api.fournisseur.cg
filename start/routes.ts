/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import swagger from '#config/swagger'
import AutoSwagger from 'adonis-autoswagger'

// =====================================
// DOCUMENTATION
// =====================================
// returns swagger in YAML (libre de middlewares)
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Route pour servir directement le fichier YAML généré
router.get('/swagger/yaml-only', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  try {
    const yamlPath = path.join(process.cwd(), 'docs', 'openapi.yaml')
    const yamlContent = await fs.readFile(yamlPath, 'utf-8')

    return yamlContent
  } catch (error) {
    return {
      error: 'Fichier YAML non trouvé',
      message: "Le fichier openapi.yaml n'est pas disponible",
      path: 'docs/openapi.yaml',
    }
  }
})

// Route pour servir la configuration Scalar Galaxy générée
router.get('/swagger/scalar-config', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  try {
    const configPath = path.join(process.cwd(), 'docs', 'scalar-galaxy-config.yaml')
    const configContent = await fs.readFile(configPath, 'utf-8')

    return configContent
  } catch (error) {
    return {
      error: 'Configuration Scalar non trouvée',
      message: "Le fichier scalar-galaxy-config.yaml n'est pas disponible",
      path: 'docs/scalar-galaxy-config.yaml',
    }
  }
})

// Route pour servir les métadonnées JSON générées
router.get('/swagger/metadata', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  try {
    const metadataPath = path.join(process.cwd(), 'docs', 'api-metadata.json')
    const metadataContent = await fs.readFile(metadataPath, 'utf-8')

    return JSON.parse(metadataContent)
  } catch (error) {
    return {
      error: 'Métadonnées non trouvées',
      message: "Le fichier api-metadata.json n'est pas disponible",
      path: 'docs/api-metadata.json',
    }
  }
})

// Renders Scalar-UI with custom configuration using generated YAML files
router.get('/docs', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  try {
    // Essayer d'abord d'utiliser la configuration Scalar complète générée
    const scalarConfigPath = path.join(process.cwd(), 'docs', 'scalar-galaxy-config.yaml')
    const scalarConfig = await fs.readFile(scalarConfigPath, 'utf-8')

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>v3 - API Reference - Fournisseur CG</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            #api-reference {
              height: 100vh;
              width: 100vw;
            }
            :root {
              --scalar-custom-header-height: 50px;
            }
            .custom-header {
              height: var(--scalar-custom-header-height);
              background-color: var(--scalar-background-1);
              box-shadow: inset 0 -1px 0 var(--scalar-border-color);
              color: var(--scalar-color-1);
              font-size: var(--scalar-font-size-2);
              padding: 0 18px;
              position: sticky;
              justify-content: space-between;
              top: 0;
              z-index: 100;
            }
            .custom-header,
            .custom-header nav {
              display: flex;
              align-items: center;
              gap: 18px;
            }
            .custom-header a:hover {
              color: var(--scalar-color-2);
            }

            /* basic theme */
            .light-mode {
              --scalar-color-1: #2a2f45;
              --scalar-color-2: #757575;
              --scalar-color-3: #8e8e8e;
              --scalar-color-accent: #7070ff;

              --scalar-background-1: #fff;
              --scalar-background-2: #f6f6f6;
              --scalar-background-3: #e7e7e7;
              --scalar-background-accent: #7070ff1f;

              --scalar-border-color: rgba(0, 0, 0, 0.1);

              --scalar-code-language-color-supersede: var(--scalar-color-3);
            }
            .dark-mode {
              --scalar-color-1: #f7f8f8;
              --scalar-color-2: rgb(180, 188, 208);
              --scalar-color-3: #b4bcd099;
              --scalar-color-accent: #828fff;

              --scalar-background-1: #000212;
              --scalar-background-2: #0d0f1e;
              --scalar-background-3: #232533;
              --scalar-background-accent: #8ab4f81f;

              --scalar-border-color: #313245;
              --scalar-code-language-color-supersede: var(--scalar-color-3);
            }
            /* Document Sidebar */
            .light-mode .t-doc__sidebar {
              --scalar-sidebar-background-1: var(--scalar-background-1);
              --scalar-sidebar-item-hover-color: currentColor;
              --scalar-sidebar-item-hover-background: var(--scalar-background-2);
              --scalar-sidebar-item-active-background: var(--scalar-background-accent);
              --scalar-sidebar-border-color: var(--scalar-border-color);
              --scalar-sidebar-color-1: var(--scalar-color-1);
              --scalar-sidebar-color-2: var(--scalar-color-2);
              --scalar-sidebar-color-active: var(--scalar-color-accent);
              --scalar-sidebar-search-background: rgba(0, 0, 0, 0.05);
              --scalar-sidebar-search-border-color: 1px solid rgba(0, 0, 0, 0.05);
              --scalar-sidebar-search-color: var(--scalar-color-3);
              --scalar-background-2: rgba(0, 0, 0, 0.03);
            }
            .dark-mode .t-doc__sidebar {
              --scalar-sidebar-background-1: var(--scalar-background-1);
              --scalar-sidebar-item-hover-color: currentColor;
              --scalar-sidebar-item-hover-background: var(--scalar-background-2);
              --scalar-sidebar-item-active-background: rgba(255, 255, 255, 0.1);
              --scalar-sidebar-border-color: var(--scalar-border-color);
              --scalar-sidebar-color-1: var(--scalar-color-1);
              --scalar-sidebar-color-2: var(--scalar-color-2);
              --scalar-sidebar-color-active: var(--scalar-color-accent);
              --scalar-sidebar-search-background: rgba(255, 255, 255, 0.1);
              --scalar-sidebar-search-border-color: 1px solid rgba(255, 255, 255, 0.05);
              --scalar-sidebar-search-color: var(--scalar-color-3);
            }
            /* advanced */
            .light-mode {
              --scalar-color-green: #069061;
              --scalar-color-red: #ef0006;
              --scalar-color-yellow: #edbe20;
              --scalar-color-blue: #0082d0;
              --scalar-color-orange: #fb892c;
              --scalar-color-purple: #5203d1;

              --scalar-button-1: rgba(0, 0, 0, 1);
              --scalar-button-1-hover: rgba(0, 0, 0, 0.8);
              --scalar-button-1-color: rgba(255, 255, 255, 0.9);
            }
            .dark-mode {
              --scalar-color-green: #00b648;
              --scalar-color-red: #dc1b19;
              --scalar-color-yellow: #ffc90d;
              --scalar-color-blue: #4eb3ec;
              --scalar-color-orange: #ff8d4d;
              --scalar-color-purple: #b191f9;

              --scalar-button-1: rgba(255, 255, 255, 1);
              --scalar-button-1-hover: rgba(255, 255, 255, 0.9);
              --scalar-button-1-color: black;
            }
            /* Custom Theme */
            .dark-mode h2.t-editor__heading,
            .dark-mode .t-editor__page-title h1,
            .dark-mode h1.section-header:not(::selection),
            .dark-mode .markdown h1,
            .dark-mode .markdown h2,
            .dark-mode .markdown h3,
            .dark-mode .markdown h4,
            .dark-mode .markdown h5,
            .dark-mode .markdown h6 {
              -webkit-text-fill-color: transparent;
              background-image: linear-gradient(to right bottom, rgb(255, 255, 255) 30%, rgba(255, 255, 255, 0.38));
              -webkit-background-clip: text;
              background-clip: text;
            }
            .sidebar-search {
              backdrop-filter: blur(12px);
            }
            @keyframes headerbackground {
              from {
                background: transparent;
                backdrop-filter: none;
              }
              to {
                background: var(--scalar-header-background-1);
                backdrop-filter: blur(12px);
              }
            }
            .dark-mode .scalar-card {
              background: rgba(255, 255, 255, 0.05) !important;
            }
            .dark-mode .scalar-card * {
              --scalar-background-2: transparent !important;
              --scalar-background-1: transparent !important;
            }
            .light-mode .dark-mode.scalar-card *,
            .light-mode .dark-mode.scalar-card {
              --scalar-background-1: #0d0f1e !important;
              --scalar-background-2: #0d0f1e !important;
              --scalar-background-3: #191b29 !important;
            }
            .light-mode .dark-mode.scalar-card {
              background: #191b29 !important;
            }
            .badge {
              box-shadow: 0 0 0 1px var(--scalar-border-color);
              margin-right: 6px;
            }

            .table-row.required-parameter .table-row-item:nth-of-type(2):after {
              background: transparent;
              box-shadow: none;
            }
            /* Hero Section Flare */
            .section-flare {
              width: 100vw;
              background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent);
              height: 100vh;
            }
            .light-mode *::selection {
              background-color: color-mix(in srgb, var(--scalar-color-accent), transparent 70%);
            }
            .dark-mode *::selection {
              background-color: color-mix(in srgb, var(--scalar-color-accent), transparent 50%);
            }

            /* document layout */
            .light-mode .t-doc .layout-content,
            .dark-mode .t-doc .layout-content {
              background: transparent;
            }

            /* document layout */
            .light-mode .t-doc .layout-content,
            .dark-mode .t-doc .layout-content {
              background: transparent;
            }

            footer {
              display: flex;
              flex-direction: row;
              font-size: var(--scalar-paragraph);
              line-height: 1.625;
              max-width: 680px;
              margin: 0 auto;
            }
            footer a {
              width: fit-content;
              color:var(--scalar-color-accent)
            }
            footer a:hover {
              cursor: pointer;
              text-decoration: underline;
            }
            @media (max-width: 1000px) {
              footer {
                max-width: 100%;
              }
            }

          </style>
        </head>
        <body>
          <header class="custom-header scalar-app">
            <b><strong>Fournisseur CG API</strong></b>
            <nav>
              <a href="https://fournisseur.cg">Fournisseur CG</a>
              <a href="https://fournisseur.cg/docs">Documentation</a>
            </nav>
          </header>
          <script
            id="api-reference"
            data-url="/swagger/scalar-config"
            data-proxy-url="https://proxy.scalar.com"
            data-content='${JSON.stringify(scalarConfig)}'
            data-layout="modern"></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `
    return html
  } catch (error) {
    // Fallback 1: Essayer le fichier OpenAPI YAML simple -
    try {
      const yamlPath = path.join(process.cwd(), 'docs', 'openapi.yaml')
      const yamlContent = await fs.readFile(yamlPath, 'utf-8')

      const html = `
        <!doctype html>
        <html>
          <head>
            <title>API Reference - Fournisseur CG</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }

              #api-reference {
                height: 100vh;
                width: 100vw;
              }

              /* basic theme */
              .light-mode {
                --scalar-color-1: #2a2f45;
                --scalar-color-2: #757575;
                --scalar-color-3: #8e8e8e;
                --scalar-color-accent: #7070ff;

                --scalar-background-1: #fff;
                --scalar-background-2: #f6f6f6;
                --scalar-background-3: #e7e7e7;
                --scalar-background-accent: #7070ff1f;

                --scalar-border-color: rgba(0, 0, 0, 0.1);

                --scalar-code-language-color-supersede: var(--scalar-color-3);
              }
              .dark-mode {
                --scalar-color-1: #f7f8f8;
                --scalar-color-2: rgb(180, 188, 208);
                --scalar-color-3: #b4bcd099;
                --scalar-color-accent: #828fff;

                --scalar-background-1: #000212;
                --scalar-background-2: #0d0f1e;
                --scalar-background-3: #232533;
                --scalar-background-accent: #8ab4f81f;

                --scalar-border-color: #313245;
                --scalar-code-language-color-supersede: var(--scalar-color-3);
              }
              /* Document Sidebar */
              .light-mode .t-doc__sidebar {
                --scalar-sidebar-background-1: var(--scalar-background-1);
                --scalar-sidebar-item-hover-color: currentColor;
                --scalar-sidebar-item-hover-background: var(--scalar-background-2);
                --scalar-sidebar-item-active-background: var(--scalar-background-accent);
                --scalar-sidebar-border-color: var(--scalar-border-color);
                --scalar-sidebar-color-1: var(--scalar-color-1);
                --scalar-sidebar-color-2: var(--scalar-color-2);
                --scalar-sidebar-color-active: var(--scalar-color-accent);
                --scalar-sidebar-search-background: rgba(0, 0, 0, 0.05);
                --scalar-sidebar-search-border-color: 1px solid rgba(0, 0, 0, 0.05);
                --scalar-sidebar-search-color: var(--scalar-color-3);
                --scalar-background-2: rgba(0, 0, 0, 0.03);
              }
              .dark-mode .t-doc__sidebar {
                --scalar-sidebar-background-1: var(--scalar-background-1);
                --scalar-sidebar-item-hover-color: currentColor;
                --scalar-sidebar-item-hover-background: var(--scalar-background-2);
                --scalar-sidebar-item-active-background: rgba(255, 255, 255, 0.1);
                --scalar-sidebar-border-color: var(--scalar-border-color);
                --scalar-sidebar-color-1: var(--scalar-color-1);
                --scalar-sidebar-color-2: var(--scalar-color-2);
                --scalar-sidebar-color-active: var(--scalar-color-accent);
                --scalar-sidebar-search-background: rgba(255, 255, 255, 0.1);
                --scalar-sidebar-search-border-color: 1px solid rgba(255, 255, 255, 0.05);
                --scalar-sidebar-search-color: var(--scalar-color-3);
              }
              /* advanced */
              .light-mode {
                --scalar-color-green: #069061;
                --scalar-color-red: #ef0006;
                --scalar-color-yellow: #edbe20;
                --scalar-color-blue: #0082d0;
                --scalar-color-orange: #fb892c;
                --scalar-color-purple: #5203d1;

                --scalar-button-1: rgba(0, 0, 0, 1);
                --scalar-button-1-hover: rgba(0, 0, 0, 0.8);
                --scalar-button-1-color: rgba(255, 255, 255, 0.9);
              }
              .dark-mode {
                --scalar-color-green: #00b648;
                --scalar-color-red: #dc1b19;
                --scalar-color-yellow: #ffc90d;
                --scalar-color-blue: #4eb3ec;
                --scalar-color-orange: #ff8d4d;
                --scalar-color-purple: #b191f9;

                --scalar-button-1: rgba(255, 255, 255, 1);
                --scalar-button-1-hover: rgba(255, 255, 255, 0.9);
                --scalar-button-1-color: black;
              }
              /* Custom Theme */
              .dark-mode h2.t-editor__heading,
              .dark-mode .t-editor__page-title h1,
              .dark-mode h1.section-header:not(::selection),
              .dark-mode .markdown h1,
              .dark-mode .markdown h2,
              .dark-mode .markdown h3,
              .dark-mode .markdown h4,
              .dark-mode .markdown h5,
              .dark-mode .markdown h6 {
                -webkit-text-fill-color: transparent;
                background-image: linear-gradient(to right bottom, rgb(255, 255, 255) 30%, rgba(255, 255, 255, 0.38));
                -webkit-background-clip: text;
                background-clip: text;
              }
              .sidebar-search {
                backdrop-filter: blur(12px);
              }
              @keyframes headerbackground {
                from {
                  background: transparent;
                  backdrop-filter: none;
                }
                to {
                  background: var(--scalar-header-background-1);
                  backdrop-filter: blur(12px);
                }
              }
              .dark-mode .scalar-card {
                background: rgba(255, 255, 255, 0.05) !important;
              }
              .dark-mode .scalar-card * {
                --scalar-background-2: transparent !important;
                --scalar-background-1: transparent !important;
              }
              .light-mode .dark-mode.scalar-card *,
              .light-mode .dark-mode.scalar-card {
                --scalar-background-1: #0d0f1e !important;
                --scalar-background-2: #0d0f1e !important;
                --scalar-background-3: #191b29 !important;
              }
              .light-mode .dark-mode.scalar-card {
                background: #191b29 !important;
              }
              .badge {
                box-shadow: 0 0 0 1px var(--scalar-border-color);
                margin-right: 6px;
              }

              .table-row.required-parameter .table-row-item:nth-of-type(2):after {
                background: transparent;
                box-shadow: none;
              }
              /* Hero Section Flare */
              .section-flare {
                width: 100vw;
                background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent);
                height: 100vh;
              }
              .light-mode *::selection {
                background-color: color-mix(in srgb, var(--scalar-color-accent), transparent 70%);
              }
              .dark-mode *::selection {
                background-color: color-mix(in srgb, var(--scalar-color-accent), transparent 50%);
              }

              /* document layout */
              .light-mode .t-doc .layout-content,
              .dark-mode .t-doc .layout-content {
                background: transparent;
              }

              /* document layout */
              .light-mode .t-doc .layout-content,
              .dark-mode .t-doc .layout-content {
                background: transparent;
              }
            </style>
          </head>
          <body>
            <script
              id="api-reference"
              data-url="/swagger/yaml-only"
              data-proxy-url="https://proxy.scalar.com"
              data-content='${JSON.stringify(yamlContent)}'
              data-layout="modern"></script>
            <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
          </body>
        </html>
      `

      return html
    } catch (yamlError) {
      // Fallback 2: Génération dynamique avec AutoSwagger
      const openApiDoc = await AutoSwagger.default.docs(router.toJSON(), swagger)

      const html = `
        <!doctype html>
        <html>
          <head>
            <title>API Reference - Fournisseur CG</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }

              #api-reference {
                height: 100vh;
                width: 100vw;
              }
            </style>
          </head>
          <body>
            <script
              id="api-reference"
              data-url="/swagger"
              data-proxy-url="https://proxy.scalar.com"
              data-content='${JSON.stringify(openApiDoc)}'
              data-layout="modern"></script>
            <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
          </body>
        </html>
      `

      return html
    }
  }
})

// =====================================
// ROUTES /v3 (avec middleware pour les routes protégées)
// =====================================
router
  .group(() => {
    // Route de base pour vérifier que l'API fonctionne
    router.get('/', async () => {
      return {
        message: 'API Fournisseur CG v3 - Orchestrateur Logistique',
        description: "Wrapper central pour l'écosystème Fournisseur Congo",
        version: '3.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          appwrite: {
            status: 'intégré',
            description: 'Backend principal (collections, documents, utilisateurs)',
          },
          mailersend: {
            status: 'en attente',
            description: 'Emails marketing et notifications',
          },
          smtp: {
            status: 'en attente',
            description: 'Messages système et bienvenue',
          },
          spaarkpay: {
            status: 'intégré',
            description: 'Paiements mobiles MTN Money, Airtel Money',
          },
        },
        endpoints: {
          documentation: '/v3/docs',
          swagger: '/v3/swagger',
          auth: '/v3/auth',
          appwrite: '/v3/appwrite',
          collections: '/v3/collections',
          spaarkpay: '/v3/spaark-pay',
          sms: '/v3/sms',
          health: '/v3/health',
        },
        authentication: {
          methods: ['Bearer Token', 'API Key', 'Basic Auth'],
          loginEndpoint: '/v3/auth/login',
          registerEndpoint: '/v3/auth/register',
          documentation: 'https://api.arkelys.cloud/v3/docs#authentication',
        },
      }
    })

    // Routes d'authentification (publiques et protégées)
    router
      .group(() => {
        const AuthController = () => import('#controllers/auth_controller')

        // Routes publiques d'authentification
        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.post('/get-token', [AuthController, 'getToken'])

        // Routes protégées d'authentification
        router.post('/logout', [AuthController, 'logout'])
        router.get('/profile', [AuthController, 'profile'])
        router.post('/refresh-token', [AuthController, 'refreshToken'])
      })
      .prefix('/auth')

    // =====================================
    // 2. DATABASE MANAGEMENT
    // =====================================
    router
      .group(() => {
        const AppwritesController = () => import('#controllers/appwrites_controller')

        // Health check Appwrite
        router.get('/health', [AppwritesController, 'health'])

        // Gestion des bases de données
        router.get('/databases', [AppwritesController, 'listDatabases'])

        // Gestion des collections
        router.get('/databases/:databaseId/collections', [AppwritesController, 'listCollections'])
        router.post('/databases/:databaseId/collections', [AppwritesController, 'createCollection'])

        // Gestion des documents
        router.get('/databases/:databaseId/collections/:collectionId/documents', [
          AppwritesController,
          'listDocuments',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/documents', [
          AppwritesController,
          'createDocument',
        ])
        router.get('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'getDocument',
        ])
        router.patch('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'updateDocument',
        ])
        router.delete('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'deleteDocument',
        ])

        // Gestion des attributs
        router.post('/databases/:databaseId/collections/:collectionId/attributes/string', [
          AppwritesController,
          'createStringAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/integer', [
          AppwritesController,
          'createIntegerAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/boolean', [
          AppwritesController,
          'createBooleanAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/datetime', [
          AppwritesController,
          'createDatetimeAttribute',
        ])
      })
      .prefix('/appwrite')
    // .middleware([() => import('#middleware/appwrite_auth_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT

    // =====================================
    // 3. COLLECTION MANAGEMENT
    // =====================================
    router
      .group(() => {
        const CollectionManagersController = () =>
          import('#controllers/collection_managers_controller')

        // Initialisation complète des collections
        router.post('/initialize', [CollectionManagersController, 'initializeAllCollections'])

        // Exécution d'actions spécifiques
        router.post('/actions', [CollectionManagersController, 'executeCollectionActions'])

        // Status des collections
        router.get('/status', [CollectionManagersController, 'getCollectionStatus'])

        // Configuration des collections
        router.get('/configuration', [CollectionManagersController, 'getCollectionConfiguration'])
      })
      .prefix('/collections')

    // =====================================
    // 4. PAYMENT PROCESSING
    // =====================================
    router
      .group(() => {
        const SpaarkPaysController = () => import('#controllers/spaark_pays_controller')

        // Health check Spaark Pay (no authentication)
        router.get('/health', [SpaarkPaysController, 'health'])

        // Test simple (no authentication)
        router.get('/test', [SpaarkPaysController, 'test'])
        router.get('/test-external', [SpaarkPaysController, 'testExternal'])

        // Protected routes with authentication
        router.group(() => {
          // Payments Spaark Pay APi
          router.post('/initiate', [SpaarkPaysController, 'initiatePayment'])
          router.get('/status/:paymentId', [SpaarkPaysController, 'getPaymentStatus'])
          router.post('/verify', [SpaarkPaysController, 'verifyPayment'])
          router.post('/verify-by-id', [SpaarkPaysController, 'verifyPaymentById'])
          router.post('/webhook', [SpaarkPaysController, 'processWebhook'])
          router.get('/transactions', [SpaarkPaysController, 'getTransactionHistory'])

          // Domains
          router.get('/domains', [SpaarkPaysController, 'getDomains'])
          router.post('/domains', [SpaarkPaysController, 'addDomain'])
          router.patch('/domains/:domainId/validate', [SpaarkPaysController, 'validateDomain'])
          router.get('/domains/stats', [SpaarkPaysController, 'getDomainStats'])

          // Users
          router.post('/api-key/:type', [SpaarkPaysController, 'generateApiKey'])
        })
        // .middleware([() => import('#middleware/spaark_pay_auth_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT
      })
      .prefix('/spaark-pay')

    // =====================================
    // 5. SMS NOTIFICATIONS
    // =====================================
    router
      .group(() => {
        const SmsController = () => import('#controllers/sms_controller')

        // Health check SMS (no authentication)
        router.get('/health', [SmsController, 'health'])

        // Test simple (no authentication)
        router.get('/test', [SmsController, 'test'])

        // Protected routes with authentication
        router.group(() => {
          // SMS sending and management
          router.post('/send', [SmsController, 'sendSms'])
          router.get('/status/:messageId', [SmsController, 'getSmsStatus'])
          router.get('/history', [SmsController, 'getSmsHistory'])
          router.get('/stats', [SmsController, 'getSmsStats'])

          // New SMS features
          router.post('/send/test', [SmsController, 'sendTestSms'])
          router.post('/send/otp', [SmsController, 'sendOtpSms'])
          router.post('/send/notification', [SmsController, 'sendNotificationSms'])
          router.get('/balance', [SmsController, 'checkBalance'])
          router.post('/calculate-cost', [SmsController, 'calculateSmsCost'])
          router.get('/api-info', [SmsController, 'getApiInfo'])

          // Webhooks
          router.post('/webhook', [SmsController, 'processWebhook'])
          router.post('/webhook/config', [SmsController, 'configureWebhook'])
        })
        // .middleware([() => import('#middleware/sms_auth_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT
      })
      .prefix('/sms')
  })
  .prefix('/v3')

export default router
