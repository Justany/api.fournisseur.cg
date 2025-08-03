import type { HttpContext } from '@adonisjs/core/http'

/**
 * Middleware pour gérer l'authentification et la sécurité pour Scalar
 * Ajoute les en-têtes de sécurité appropriés et gère l'authentification
 */
export default class ScalarAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('🚀 [DEBUG] ===== ScalarAuthMiddleware DÉBUT =====')
    console.log('🔍 [DEBUG] ScalarAuthMiddleware appelé pour:', ctx.request.url())

    // Ajouter les en-têtes de sécurité pour Scalar
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-Frame-Options', 'DENY')
    ctx.response.header('X-XSS-Protection', '1; mode=block')
    ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    ctx.response.header(
      'Content-Security-Policy',
      "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'"
    )

    // En-têtes pour CORS si nécessaire
    ctx.response.header('Access-Control-Allow-Origin', '*')
    ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

    // En-têtes pour Scalar
    ctx.response.header('X-Scalar-Version', '1.0.0')
    ctx.response.header('X-API-Version', 'v3')

    const currentPath = ctx.request.url()
    console.log('📍 [DEBUG] Route actuelle:', currentPath)

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
      console.log('✅ [DEBUG] Route publique détectée, passage direct')
      await next()
      return
    }

    // Pour les routes protégées, vérifier l'authentification
    console.log('🔒 [DEBUG] Route protégée détectée, vérification authentification')

    const apiKey = ctx.request.header('x-api-key')
    const authToken = ctx.request.header('authorization')

    console.log('🔑 [DEBUG] Token:', authToken ? 'présent' : 'absent')
    console.log('🔑 [DEBUG] API Key:', apiKey ? 'présent' : 'absent')

    // Si aucune authentification n'est fournie, retourner une erreur
    if (!apiKey && !authToken) {
      console.log('❌ [DEBUG] Aucune authentification fournie, retour 401')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification requise',
        details: "Clé API ou token d'authentification manquant",
        documentation: 'https://api.fournisseur.cg/v3/docs#authentication',
      })
    }

    // Ajouter les informations d'authentification au contexte
    ctx.authInfo = {
      apiKey: apiKey || null,
      token: authToken ? authToken.replace('Bearer ', '') : null,
      timestamp: new Date().toISOString(),
    }

    console.log('✅ [DEBUG] Authentification OK, passage au contrôleur')
    await next()
    console.log('✅ [DEBUG] Retour du contrôleur')
    console.log('🏁 [DEBUG] ===== ScalarAuthMiddleware FIN =====')
  }
}
