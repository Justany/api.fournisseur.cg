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

// =====================================
// ROUTES /v3 (avec middleware pour les routes protégées)
// =====================================
router
  .group(() => {
    // Middleware de logging réseau en mode développement
    router.use([() => import('#middleware/network_logging_middleware')])

    // Health check route for Dokploy/Traefik
    router.get('/health', async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      }
    })

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
    // 5. SMS NOTIFICATIONS (MTN API)
    // =====================================
    router
      .group(() => {
        const SmsController = () => import('#controllers/sms_controller')

        // Health check SMS (no authentication)
        router.get('/health', [SmsController, 'health'])

        // Protected routes with authentication
        router.group(() => {
          // SMS selon l'API officielle MTN : POST https://sms.mtncongo.net/api/sms/
          router.post('/send', [SmsController, 'sendSms'])

          // Vérification de statut selon l'API MTN : POST avec { "op": "status", "id": "26" }
          router.get('/status/:messageId', [SmsController, 'getSmsStatus'])

          // Codes de statut MTN officiels
          router.get('/status-codes', [SmsController, 'getStatusCodes'])

          // Utilitaire de calcul de coût selon les règles MTN
          router.post('/calculate-cost', [SmsController, 'calculateSmsCost'])
        })
        // .middleware([() => import('#middleware/sms_auth_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT
      })
      .prefix('/sms')

    // =====================================
    // 6. PawaPay (Mobile Money)
    // =====================================
    router
      .group(() => {
        const PawaPayController = () => import('#controllers/pawapay_controller')

        // Toolkit / health
        router.get('/availability', [PawaPayController, 'availability'])

        // Providers and configuration
        router.get('/providers', [PawaPayController, 'listProviders'])
        router.get('/active-conf', [PawaPayController, 'getActiveConfiguration'])

        // Deposits
        router.post('/deposits/request', [PawaPayController, 'requestDeposit'])
        router.get('/deposits/:depositId/status', [PawaPayController, 'checkDepositStatus'])

        // Payouts
        router.post('/payouts/request', [PawaPayController, 'requestPayout'])
        router.get('/payouts/:payoutId/status', [PawaPayController, 'checkPayoutStatus'])

        // Refunds
        router.post('/refunds/request', [PawaPayController, 'requestRefund'])
        router.get('/refunds/:refundId/status', [PawaPayController, 'checkRefundStatus'])

        // Callbacks
        router.post('/callbacks/deposits', [PawaPayController, 'depositCallback'])
        router.post('/callbacks/resend/deposit/:depositId', [
          PawaPayController,
          'resendDepositCallback',
        ])
        router.post('/callbacks/payouts', [PawaPayController, 'payoutCallback'])
        router.post('/callbacks/refunds', [PawaPayController, 'refundCallback'])
      })
      .prefix('/pawapay')
  })
  .prefix('/v3')

export default router
