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
// ROUTES /v3
// =====================================
router
  .group(() => {
    // Informations de base
    router.get('/', async () => {
      return {
        success: true,
        message: 'API Fournisseur CG v3',
        version: '3.0.0',
        documentation: '/swagger',
        endpoints: {
          auth: '/v3/auth',
          appwrite: '/v3/appwrite',
          collections: '/v3/collections',
          spaarkPay: '/v3/spaark-pay',
          sms: '/v3/sms',
        },
      }
    })

    // Routes d'authentification
    router
      .group(() => {
        const AuthController = () => import('#controllers/auth_controller')
        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.post('/get-token', [AuthController, 'getToken'])
      })
      .prefix('/auth')

    // Routes Appwrite (protégées)
    router
      .group(() => {
        const AppwritesController = () => import('#controllers/appwrites_controller')
        router.get('/health', [AppwritesController, 'health'])
        router.get('/databases', [AppwritesController, 'listDatabases'])
        router.get('/databases/:databaseId/collections', [AppwritesController, 'listCollections'])
      })
      .prefix('/appwrite')
    // .middleware([() => import('#middleware/test_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT

    // Routes Spaark Pay
    router
      .group(() => {
        const SpaarkPaysController = () => import('#controllers/spaark_pays_controller')
        router.get('/health', [SpaarkPaysController, 'health'])
        router.get('/test', [SpaarkPaysController, 'test'])
      })
      .prefix('/spaark-pay')

    // Routes SMS
    router
      .group(() => {
        const SmsController = () => import('#controllers/sms_controller')
        router.get('/health', [SmsController, 'health'])
        router.get('/test', [SmsController, 'test'])
      })
      .prefix('/sms')
  })
  .prefix('/v3')
// .middleware([() => import('#middleware/test_middleware')]) // DÉSACTIVÉ TEMPORAIREMENT

export default router
