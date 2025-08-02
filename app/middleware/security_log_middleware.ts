import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

/**
 * Middleware de logs de sécurité pour les endpoints Spaark Pay
 * Trace toutes les activités pour la sécurité et l'audit
 */
export default class SecurityLogMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const startTime = Date.now()
    const { method, url } = ctx.request
    const clientIP = ctx.request.ip()
    const userAgent = ctx.request.header('user-agent') || 'unknown'
    const referer = ctx.request.header('referer') || 'unknown'

    // Informations de base de la requête
    const requestInfo = {
      timestamp: DateTime.now().toISO(),
      method,
      url,
      clientIP,
      userAgent,
      referer,
      headers: {
        'content-type': ctx.request.header('content-type'),
        'content-length': ctx.request.header('content-length'),
        'x-api-key': ctx.request.header('x-api-key') ? '***' : undefined,
        'authorization': ctx.request.header('authorization') ? 'Bearer ***' : undefined
      }
    }

    try {
      // Exécuter la requête
      await next()

      // Log de succès
      const duration = Date.now() - startTime
      const responseStatus = ctx.response.getStatus()

      console.log('🔒 [SECURITY] Requête Spaark Pay:', {
        ...requestInfo,
        status: responseStatus,
        duration: `${duration}ms`,
        success: responseStatus < 400
      })

      // Log spécial pour les paiements
      if (url.includes('/initiate') && method === 'POST') {
        const body = ctx.request.body()
        console.log('💰 [PAYMENT] Nouveau paiement initié:', {
          phone: body.phone,
          amount: body.amount,
          mode: body.mode,
          reference: body.reference,
          clientIP,
          timestamp: DateTime.now().toISO()
        })
      }

      // Log pour les vérifications
      if (url.includes('/verify') && method === 'POST') {
        const body = ctx.request.body()
        console.log('🔍 [VERIFY] Vérification de paiement:', {
          token: body.token ? '***' : undefined,
          paymentId: body.paymentId,
          mode: body.mode,
          clientIP,
          timestamp: DateTime.now().toISO()
        })
      }

    } catch (error) {
      // Log d'erreur
      const duration = Date.now() - startTime
      console.error('❌ [SECURITY] Erreur Spaark Pay:', {
        ...requestInfo,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      })

      // Log d'alerte pour les erreurs de sécurité
      if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        console.warn('🚨 [ALERT] Tentative d'accès non autorisé:', {
          clientIP,
          url,
          userAgent,
          timestamp: DateTime.now().toISO()
        })
      }

      throw error
    }
  }
}
