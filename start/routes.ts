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
    // 1. AUTHENTICATION
    // =====================================
    router
      .group(() => {
        const AuthController = () => import('#controllers/auth_controller')

        // Public authentication routes
        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.post('/get-token', [AuthController, 'getToken']) // Temporary route to get token

        // Protected authentication routes
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

        // Database management
        router.get('/databases', [AppwritesController, 'listDatabases'])

        // Collection management
        router.get('/databases/:databaseId/collections', [AppwritesController, 'listCollections'])
        router.post('/databases/:databaseId/collections', [AppwritesController, 'createCollection'])

        // Document management
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

        // Attribute management
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

        // Complete collection initialization
        router.post('/initialize', [CollectionManagersController, 'initializeAllCollections'])

        // Execute specific actions
        router.post('/actions', [CollectionManagersController, 'executeCollectionActions'])

        // Collection status
        router.get('/status', [CollectionManagersController, 'getCollectionStatus'])

        // Collection configuration
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

        // Simple test (no authentication)
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

        // Simple test (no authentication)
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

export default router
