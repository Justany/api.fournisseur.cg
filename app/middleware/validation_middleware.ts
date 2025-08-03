import type { HttpContext } from '@adonisjs/core/http'

/**
 * Middleware de validation pour les endpoints Spaark Pay
 * Valide les données entrantes et prévient les attaques
 */
export default class ValidationMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const { method, url } = ctx.request

    // Validation des headers de sécurité
    const contentType = ctx.request.header('content-type')
    if (method() === 'POST' || method() === 'PUT' || method() === 'PATCH') {
      if (!contentType || !contentType.includes('application/json')) {
        return ctx.response.badRequest({
          success: false,
          error: 'Content-Type invalide',
          details: 'Le Content-Type doit être application/json',
        })
      }
    }

    // Validation de la taille du body
    const contentLength = ctx.request.header('content-length')
    if (contentLength && Number.parseInt(contentLength) > 1024 * 1024) {
      // 1MB max
      return ctx.response.badRequest({
        success: false,
        error: 'Body trop volumineux',
        details: 'La taille du body ne peut pas dépasser 1MB',
      })
    }

    // Validation des paramètres de route
    if (url().includes('/status/')) {
      const paymentId = ctx.params.paymentId
      if (paymentId && Number.isNaN(Number.parseInt(paymentId))) {
        return ctx.response.badRequest({
          success: false,
          error: 'ID de paiement invalide',
          details: "L'ID doit être un nombre",
        })
      }
    }

    // Validation des données du body pour les paiements
    if (url().includes('/initiate') && method() === 'POST') {
      const body = ctx.request.body()

      if (!body.phone || typeof body.phone !== 'string') {
        return ctx.response.badRequest({
          success: false,
          error: 'Numéro de téléphone manquant',
          details: 'Le numéro de téléphone est requis',
        })
      }

      if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
        return ctx.response.badRequest({
          success: false,
          error: 'Montant invalide',
          details: 'Le montant doit être un nombre positif',
        })
      }

      if (!body.mode || !['airtel', 'momo'].includes(body.mode)) {
        return ctx.response.badRequest({
          success: false,
          error: 'Mode de paiement invalide',
          details: 'Le mode doit être "airtel" ou "momo"',
        })
      }

      // Validation du numéro de téléphone
      const phoneRegex = /^0[5-7][0-9]{7}$/
      if (!phoneRegex.test(body.phone)) {
        return ctx.response.badRequest({
          success: false,
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format congolais (0XXXXXXXX)',
        })
      }

      // Limitation du montant
      if (body.amount > 1000000) {
        // 1 million FCFA max
        return ctx.response.badRequest({
          success: false,
          error: 'Montant trop élevé',
          details: 'Le montant ne peut pas dépasser 1,000,000 FCFA',
        })
      }
    }

    // Validation des données pour la vérification
    if (url().includes('/verify') && method() === 'POST') {
      const body = ctx.request.body()

      if (!body.token || typeof body.token !== 'string') {
        return ctx.response.badRequest({
          success: false,
          error: 'Token manquant',
          details: 'Le token est requis',
        })
      }

      if (!body.mode || !['airtel', 'momo'].includes(body.mode)) {
        return ctx.response.badRequest({
          success: false,
          error: 'Mode invalide',
          details: 'Le mode doit être "airtel" ou "momo"',
        })
      }
    }

    await next()
  }
}
