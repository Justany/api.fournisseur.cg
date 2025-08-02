import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

/**
 * Middleware d'authentification pour les endpoints Spaark Pay
 * Vérifie la présence d'un token API valide
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const apiKey = ctx.request.header('x-api-key')
    const authToken = ctx.request.header('authorization')

    // Vérifier la présence d'une clé API ou d'un token
    if (!apiKey && !authToken) {
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification requise',
        details: 'Clé API ou token d\'authentification manquant'
      })
    }

    // Vérifier la clé API si présente
    if (apiKey) {
      const validApiKeys = [
        env.get('SPAARK_PAY_TEST_API_KEY'),
        env.get('SPAARK_PAY_LIVE_API_KEY')
      ].filter(Boolean)

      if (!validApiKeys.includes(apiKey)) {
        return ctx.response.unauthorized({
          success: false,
          error: 'Clé API invalide',
          details: 'La clé API fournie n\'est pas valide'
        })
      }
    }

    // Vérifier le token Bearer si présent
    if (authToken) {
      if (!authToken.startsWith('Bearer ')) {
        return ctx.response.unauthorized({
          success: false,
          error: 'Format de token invalide',
          details: 'Le token doit être au format "Bearer <token>"'
        })
      }

      const token = authToken.replace('Bearer ', '')
      const validToken = env.get('SPAARK_PAY_TOKEN')

      if (token !== validToken) {
        return ctx.response.unauthorized({
          success: false,
          error: 'Token invalide',
          details: 'Le token d\'authentification n\'est pas valide'
        })
      }
    }

    // Ajouter les informations d'authentification au contexte
    ctx.authInfo = {
      apiKey: apiKey || null,
      token: authToken ? authToken.replace('Bearer ', '') : null,
      timestamp: new Date().toISOString()
    }

    await next()
  }
}
