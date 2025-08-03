import type { HttpContext } from '@adonisjs/core/http'

/**
 * Middleware de test simple pour diagnostiquer les problèmes
 */
export default class TestMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('🧪 [TEST] TestMiddleware appelé pour:', ctx.request.url())

    const currentPath = ctx.request.url()

    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = [
      '/v3/auth/login',
      '/v3/auth/register',
      '/v3/auth/get-token',
      '/docs',
      '/swagger',
    ]

    // Vérifier si c'est une route publique
    const isPublicRoute = publicRoutes.some((route) => currentPath.includes(route))

    if (isPublicRoute) {
      console.log('✅ [TEST] Route publique détectée, passage direct')
      await next()
      return
    }

    // Pour les routes protégées, vérifier l'authentification
    console.log('🔒 [TEST] Route protégée détectée, vérification authentification')

    // Vérifier l'authentification
    const apiKey = ctx.request.header('x-api-key')
    const authToken = ctx.request.header('authorization')

    console.log('🔑 [TEST] Token:', authToken ? 'présent' : 'absent')
    console.log('🔑 [TEST] API Key:', apiKey ? 'présent' : 'absent')

    // Si aucune authentification n'est fournie, retourner une erreur
    if (!apiKey && !authToken) {
      console.log('❌ [TEST] Aucune authentification fournie, retour 401')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification requise',
        details: "Clé API ou token d'authentification manquant",
      })
    }

    console.log('✅ [TEST] Authentification OK, passage au contrôleur')
    await next()
    console.log('✅ [TEST] Retour du contrôleur')
  }
}
