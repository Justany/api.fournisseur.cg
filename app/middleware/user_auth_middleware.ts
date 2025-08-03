import type { HttpContext } from '@adonisjs/core/http'

/**
 * Middleware d'authentification pour les utilisateurs
 * Vérifie la présence d'un token Bearer valide
 */
export default class UserAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const authToken = ctx.request.header('authorization')

    // Vérifier la présence d'un token Bearer
    if (!authToken) {
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification requise',
        details: "Token Bearer manquant dans l'en-tête Authorization",
      })
    }

    // Vérifier le format du token
    if (!authToken.startsWith('Bearer ')) {
      return ctx.response.unauthorized({
        success: false,
        error: 'Format de token invalide',
        details: 'Le token doit être au format "Bearer <token>"',
      })
    }

    // L'authentification sera gérée par Adonis Auth
    // Ce middleware vérifie juste la présence du token
    await next()
  }
}
