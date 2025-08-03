import type { HttpContext } from '@adonisjs/core/http'

// Étendre le type HttpContext pour inclure userAuthInfo
declare module '@adonisjs/core/http' {
  interface HttpContext {
    userAuthInfo?: {
      token: string | null
      userId: string | null
      timestamp: string
    }
  }
}

/**
 * Middleware d'authentification général pour les utilisateurs
 * Responsabilité unique : vérifier le token Bearer des utilisateurs
 */
export default class UserAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('👤 [USER_AUTH] Middleware appelé pour:', ctx.request.url())

    // Routes publiques qui ne nécessitent pas d'authentification utilisateur
    const publicRoutes = [
      '/v3/auth/login',
      '/v3/auth/register',
      '/v3/auth/get-token',
      '/v3/',
      '/swagger',
      '/swagger/yaml-only',
      '/swagger/scalar-config',
      '/swagger/metadata',
      '/docs',
    ]

    // Vérifier si la route actuelle est publique
    const currentPath = ctx.request.url()
    const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

    console.log('📍 [USER_AUTH] Route actuelle:', currentPath)
    console.log('✅ [USER_AUTH] Route publique:', isPublicRoute)

    // Si c'est une route publique, laisser passer sans authentification
    if (isPublicRoute) {
      console.log('✅ [USER_AUTH] Passage direct pour route publique')
      await next()
      return
    }

    console.log('🔒 [USER_AUTH] Route protégée, vérification token utilisateur')

    // Pour les routes protégées, vérifier l'authentification utilisateur
    const authToken = ctx.request.header('authorization')

    // Vérifier la présence d'un token Bearer
    if (!authToken) {
      console.log('❌ [USER_AUTH] Token utilisateur manquant')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification utilisateur requise',
        details: "Token Bearer manquant dans l'en-tête Authorization",
      })
    }

    // Vérifier le format du token
    if (!authToken.startsWith('Bearer ')) {
      console.log('❌ [USER_AUTH] Format de token utilisateur invalide')
      return ctx.response.unauthorized({
        success: false,
        error: 'Format de token invalide',
        details: 'Le token doit être au format "Bearer <token>"',
      })
    }

    // Vérifier que le token commence par "oat_" (format AdonisJS)
    const token = authToken.replace('Bearer ', '')
    if (!token.startsWith('oat_')) {
      console.log('❌ [USER_AUTH] Token utilisateur invalide (format)')
      return ctx.response.unauthorized({
        success: false,
        error: 'Token utilisateur invalide',
        details: 'Le token doit être au format oat_...',
      })
    }

    console.log('✅ [USER_AUTH] Token utilisateur valide, passage au contrôleur')

    // Ici vous pouvez ajouter la validation du token avec AdonisJS Auth
    // const user = await auth.use('api').verify(token)
    // ctx.userAuthInfo = { userId: user.id, token, timestamp: new Date().toISOString() }

    // Pour l'instant, on accepte le token
    ctx.userAuthInfo = {
      token,
      userId: null, // Sera défini après validation avec AdonisJS Auth
      timestamp: new Date().toISOString(),
    }

    await next()
  }
}
