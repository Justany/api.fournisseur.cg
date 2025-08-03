import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

// Étendre le type HttpContext pour inclure smsAuthInfo
declare module '@adonisjs/core/http' {
  interface HttpContext {
    smsAuthInfo?: {
      apiKey: string | null
      token: string | null
      timestamp: string
    }
  }
}

/**
 * Middleware d'authentification spécifique pour SMS
 * Responsabilité unique : vérifier les clés API et tokens SMS
 */
export default class SmsAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('📱 [SMS_AUTH] Middleware appelé pour:', ctx.request.url())

    // Routes publiques SMS
    const publicRoutes = [
      '/v3/sms/health',
      '/v3/sms/test',
    ]

    // Vérifier si la route actuelle est publique
    const currentPath = ctx.request.url()
    const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

    console.log('📍 [SMS_AUTH] Route actuelle:', currentPath)
    console.log('✅ [SMS_AUTH] Route publique:', isPublicRoute)

    // Si c'est une route publique, laisser passer sans authentification
    if (isPublicRoute) {
      console.log('✅ [SMS_AUTH] Passage direct pour route publique')
      await next()
      return
    }

    console.log('🔒 [SMS_AUTH] Route protégée, vérification authentification SMS')

    // Pour les routes protégées, vérifier l'authentification SMS
    const apiKey = ctx.request.header('x-sms-api-key')
    const authToken = ctx.request.header('x-sms-token')

    // Vérifier la présence d'une clé API ou d'un token
    if (!apiKey && !authToken) {
      console.log('❌ [SMS_AUTH] Aucune authentification SMS fournie')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification SMS requise',
        details: "Clé API ou token d'authentification SMS manquant",
      })
    }

    // Vérifier la clé API si présente
    if (apiKey) {
      console.log('🔑 [SMS_AUTH] Validation clé API SMS:', apiKey.substring(0, 10) + '...')
      const validApiKeys = [
        env.get('SMS_API_KEY'),
        env.get('SMS_TEST_API_KEY'),
      ].filter(Boolean)

      if (!validApiKeys.includes(apiKey)) {
        console.log('❌ [SMS_AUTH] Clé API SMS invalide')
        return ctx.response.unauthorized({
          success: false,
          error: 'Clé API SMS invalide',
          details: "La clé API SMS fournie n'est pas valide",
        })
      }
      console.log('✅ [SMS_AUTH] Clé API SMS valide')
    }

    // Vérifier le token si présent
    if (authToken) {
      console.log('🔑 [SMS_AUTH] Validation token SMS')
      const validToken = env.get('SMS_TOKEN')

      if (authToken !== validToken) {
        console.log('❌ [SMS_AUTH] Token SMS invalide')
        return ctx.response.unauthorized({
          success: false,
          error: 'Token SMS invalide',
          details: "Le token d'authentification SMS n'est pas valide",
        })
      }
      console.log('✅ [SMS_AUTH] Token SMS valide')
    }

    console.log('✅ [SMS_AUTH] Authentification SMS OK, passage au contrôleur')

    // Ajouter les informations d'authentification SMS au contexte
    ctx.smsAuthInfo = {
      apiKey: apiKey || null,
      token: authToken || null,
      timestamp: new Date().toISOString(),
    }

    await next()
  }
}
