import type { HttpContext } from '@adonisjs/core/http'

// Store pour les limites de taux (en production, utilisez Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Middleware de rate limiting pour les endpoints Spaark Pay
 * Limite le nombre de requêtes par IP et par endpoint
 */
export default class RateLimitMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const clientIP = ctx.request.ip()
    const userAgent = ctx.request.header('user-agent') || 'unknown'
    const endpoint = ctx.request.url()
    const method = ctx.request.method()

    // Créer une clé unique pour chaque client/endpoint
    const key = `${clientIP}:${endpoint}:${method}`
    const now = Date.now()

    // Configuration des limites par endpoint
    const limits = {
      '/v3/spaark-pay/initiate': { max: 10, window: 60000 }, // 10 req/min
      '/v3/spaark-pay/verify': { max: 30, window: 60000 }, // 30 req/min
      '/v3/spaark-pay/verify-by-id': { max: 30, window: 60000 }, // 30 req/min
      '/v3/spaark-pay/status': { max: 60, window: 60000 }, // 60 req/min
      '/v3/spaark-pay/transactions': { max: 20, window: 60000 }, // 20 req/min
      '/v3/spaark-pay/domains': { max: 30, window: 60000 }, // 30 req/min
      '/v3/spaark-pay/health': { max: 100, window: 60000 }, // 100 req/min
      '/v3/spaark-pay/test': { max: 50, window: 60000 }, // 50 req/min
    }

    // Trouver la limite pour cet endpoint
    const limit = Object.entries(limits).find(([pattern]) =>
      endpoint.includes(pattern)
    )?.[1] || { max: 30, window: 60000 }

    // Vérifier si la fenêtre de temps a expiré
    const existing = rateLimitStore.get(key)
    if (existing && now > existing.resetTime) {
      rateLimitStore.delete(key)
    }

    // Obtenir ou créer l'entrée pour cette clé
    const entry = rateLimitStore.get(key) || { count: 0, resetTime: now + limit.window }

    // Vérifier si la limite est dépassée
    if (entry.count >= limit.max) {
      return ctx.response.tooManyRequests({
        success: false,
        error: 'Rate limit dépassé',
        details: `Limite de ${limit.max} requêtes par ${limit.window / 1000} secondes dépassée`,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      })
    }

    // Incrémenter le compteur
    entry.count++
    rateLimitStore.set(key, entry)

    // Ajouter les headers de rate limiting
    ctx.response.header('X-RateLimit-Limit', limit.max.toString())
    ctx.response.header('X-RateLimit-Remaining', (limit.max - entry.count).toString())
    ctx.response.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())

    await next()
  }
}
