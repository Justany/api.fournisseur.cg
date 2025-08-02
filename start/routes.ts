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

// returns swagger in YAML
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Renders Swagger-UI and passes YAML-output of /swagger
router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/swagger')
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
    // 2. APPRITE (Backend Principal)
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
    // 3. COLLECTIONS (Gestion des Collections)
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
    // 4. SPAARK PAY (Paiements Mobiles)
    // =====================================
    router
      .group(() => {
        const SpaarkPaysController = () => import('#controllers/spaark_pays_controller')

        // Health check Spaark Pay (sans authentification)
        router.get('/health', [SpaarkPaysController, 'health'])

        // Test simple (sans authentification)
        router.get('/test', [SpaarkPaysController, 'test'])

        // Routes protégées avec authentification
        router
          .group(() => {
            // Paiements
            router.post('/initiate', [SpaarkPaysController, 'initiatePayment'])
            router.get('/status/:paymentId', [SpaarkPaysController, 'getPaymentStatus'])
            router.post('/verify', [SpaarkPaysController, 'verifyPayment'])
            router.post('/verify-by-id', [SpaarkPaysController, 'verifyPaymentById'])
            router.post('/webhook', [SpaarkPaysController, 'processWebhook'])
            router.get('/transactions', [SpaarkPaysController, 'getTransactionHistory'])

            // Domaines
            router.get('/domains', [SpaarkPaysController, 'getDomains'])
            router.post('/domains', [SpaarkPaysController, 'addDomain'])
            router.patch('/domains/:domainId/validate', [SpaarkPaysController, 'validateDomain'])
            router.get('/domains/stats', [SpaarkPaysController, 'getDomainStats'])

            // Utilisateurs
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
        // Headers de sécurité pour toutes les routes Spaark Pay
        ctx.response.header('X-Content-Type-Options', 'nosniff')
        ctx.response.header('X-Frame-Options', 'DENY')
        ctx.response.header('X-XSS-Protection', '1; mode=block')
        ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        ctx.response.header('Content-Security-Policy', "default-src 'self'")

        await next()
      })

    // =====================================
    // 5. SMS (Notifications SMS)
    // =====================================
    router
      .group(() => {
        const SmsController = () => import('#controllers/sms_controller')

        // Health check SMS (sans authentification)
        router.get('/health', [SmsController, 'health'])

        // Test simple (sans authentification)
        router.get('/test', [SmsController, 'test'])

        // Routes protégées avec authentification
        router
          .group(() => {
            // Envoi et gestion des SMS
            router.post('/send', [SmsController, 'sendSms'])
            router.get('/status/:messageId', [SmsController, 'getSmsStatus'])
            router.get('/history', [SmsController, 'getSmsHistory'])
            router.get('/stats', [SmsController, 'getSmsStats'])

            // Nouvelles fonctionnalités SMS
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
        // Headers de sécurité pour toutes les routes SMS
        ctx.response.header('X-Content-Type-Options', 'nosniff')
        ctx.response.header('X-Frame-Options', 'DENY')
        ctx.response.header('X-XSS-Protection', '1; mode=block')
        ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        ctx.response.header('Content-Security-Policy', "default-src 'self'")

        await next()
      })
  })
  .prefix('/v3')

export default router
