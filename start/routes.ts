/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'

// Route de fallback pour les anciennes versions
router.get('/', async () => {
  return {
    message: 'API Fournisseur CG',
    currentVersion: 'v3',
    availableVersions: ['v3'],
    documentation: 'https://api.fournisseur.cg/v3/docs',
  }
})

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

          </style>
        </head>
        <body>
          <header class="custom-header scalar-app">
            <b>Fournisseur CG API</b>
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
    // Fallback 1: Essayer le fichier OpenAPI YAML simple
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
          documentation: 'https://api.fournisseur.cg/v3/docs#authentication',
        },
      }
    })

    // =====================================
    // 1. AUTHENTIFICATION
    // =====================================
    router
      .group(() => {
        const AuthController = () => import('#controllers/auth_controller')

        // Routes publiques d'authentification
        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.post('/get-token', [AuthController, 'getToken']) // Route temporaire pour obtenir le token

        // Routes protégées d'authentification
        router
          .group(() => {
            router.post('/logout', [AuthController, 'logout'])
            router.get('/profile', [AuthController, 'profile'])
            router.post('/refresh-token', [AuthController, 'refreshToken'])
          })
          .middleware([
            () => import('#middleware/user_auth_middleware'),
            () => import('#middleware/validation_middleware'),
            () => import('#middleware/rate_limit_middleware'),
            () => import('#middleware/security_log_middleware'),
          ])
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

        // Protected routes with authentication
        router
          .group(() => {
            // Payments
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
          .middleware([
            () => import('#middleware/auth_middleware'),
            () => import('#middleware/validation_middleware'),
            () => import('#middleware/rate_limit_middleware'),
            () => import('#middleware/security_log_middleware'),
          ])
      })
      .prefix('/spaark-pay')
      .middleware(async (ctx, next) => {
        // Security headers for all Spaark Pay routes
        ctx.response.header('X-Content-Type-Options', 'nosniff')
        ctx.response.header('X-Frame-Options', 'DENY')
        ctx.response.header('X-XSS-Protection', '1; mode=block')
        ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        ctx.response.header('Content-Security-Policy', "default-src 'self'")

        await next()
      })

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
        router
          .group(() => {
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
          .middleware([
            () => import('#middleware/auth_middleware'),
            () => import('#middleware/validation_middleware'),
            () => import('#middleware/rate_limit_middleware'),
            () => import('#middleware/security_log_middleware'),
          ])
      })
      .prefix('/sms')
      .middleware(async (ctx, next) => {
        // Security headers for all SMS routes
        ctx.response.header('X-Content-Type-Options', 'nosniff')
        ctx.response.header('X-Frame-Options', 'DENY')
        ctx.response.header('X-XSS-Protection', '1; mode=block')
        ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        ctx.response.header('Content-Security-Policy', "default-src 'self'")

        await next()
      })
  })
  .prefix('/v3')
  .middleware([() => import('#middleware/scalar_auth_middleware')])

export default router
