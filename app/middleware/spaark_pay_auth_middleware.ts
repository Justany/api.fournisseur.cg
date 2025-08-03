import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

// Étendre le type HttpContext pour inclure spaarkPayAuthInfo
declare module '@adonisjs/core/http' {
  interface HttpContext {
    spaarkPayAuthInfo?: {
      apiKey: string | null
      token: string | null
      timestamp: string
    }
  }
}

/**
 * Middleware d'authentification spécifique pour Spaark Pay
 * Responsabilité unique : vérifier les clés API et tokens Spaark Pay
 */
export default class SpaarkPayAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('💰 [SPAARK_PAY_AUTH] Middleware appelé pour:', ctx.request.url())

    // Routes publiques Spaark Pay
    const publicRoutes = ['/v3/spaark-pay/health', '/v3/spaark-pay/test']

    // Vérifier si la route actuelle est publique
    const currentPath = ctx.request.url()
    const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

    console.log('📍 [SPAARK_PAY_AUTH] Route actuelle:', currentPath)
    console.log('✅ [SPAARK_PAY_AUTH] Route publique:', isPublicRoute)

    // Si c'est une route publique, laisser passer sans authentification
    if (isPublicRoute) {
      console.log('✅ [SPAARK_PAY_AUTH] Passage direct pour route publique')
      await next()
      return
    }

    console.log('🔒 [SPAARK_PAY_AUTH] Route protégée, vérification authentification Spaark Pay')

    // Pour les routes protégées, vérifier l'authentification Spaark Pay
    const apiKey = ctx.request.header('x-api-key')
    const authToken = ctx.request.header('authorization')

    // Vérifier la présence d'une clé API ou d'un token
    if (!apiKey && !authToken) {
      console.log('❌ [SPAARK_PAY_AUTH] Aucune authentification Spaark Pay fournie')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification Spaark Pay requise',
        details: "Clé API ou token d'authentification Spaark Pay manquant",
      })
    }

    // Vérifier la clé API si présente
    if (apiKey) {
      console.log('🔑 [SPAARK_PAY_AUTH] Validation clé API:', apiKey.substring(0, 10) + '...')
      const validApiKeys = [
        env.get('SPAARK_PAY_TEST_API_KEY'),
        env.get('SPAARK_PAY_LIVE_API_KEY'),
      ].filter(Boolean)

      if (!validApiKeys.includes(apiKey)) {
        console.log('❌ [SPAARK_PAY_AUTH] Clé API Spaark Pay invalide')
        return ctx.response.unauthorized({
          success: false,
          error: 'Clé API Spaark Pay invalide',
          details: "La clé API Spaark Pay fournie n'est pas valide",
        })
      }
      console.log('✅ [SPAARK_PAY_AUTH] Clé API Spaark Pay valide')
    }

    // Vérifier le token Bearer si présent
    if (authToken) {
      console.log('🔑 [SPAARK_PAY_AUTH] Validation token Bearer')
      if (!authToken.startsWith('Bearer ')) {
        console.log('❌ [SPAARK_PAY_AUTH] Format de token Spaark Pay invalide')
        return ctx.response.unauthorized({
          success: false,
          error: 'Format de token Spaark Pay invalide',
          details: 'Le token Spaark Pay doit être au format "Bearer <token>"',
        })
      }

      const token = authToken.replace('Bearer ', '')
      const validToken = env.get('SPAARK_PAY_TOKEN')

      if (token !== validToken) {
        console.log('❌ [SPAARK_PAY_AUTH] Token Spaark Pay invalide')
        return ctx.response.unauthorized({
          success: false,
          error: 'Token Spaark Pay invalide',
          details: "Le token d'authentification Spaark Pay n'est pas valide",
        })
      }
      console.log('✅ [SPAARK_PAY_AUTH] Token Spaark Pay valide')
    }

    console.log('✅ [SPAARK_PAY_AUTH] Authentification Spaark Pay OK, passage au contrôleur')

    // Ajouter les informations d'authentification Spaark Pay au contexte
    ctx.spaarkPayAuthInfo = {
      apiKey: apiKey || null,
      token: authToken ? authToken.replace('Bearer ', '') : null,
      timestamp: new Date().toISOString(),
    }

    await next()
  }
}
