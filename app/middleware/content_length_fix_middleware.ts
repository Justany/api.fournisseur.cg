import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour corriger les problèmes de Content-Length
 * avec les clients de documentation (Scalar, Swagger UI, etc.)
 */
export default class ContentLengthFixMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Détecter les clients de documentation
    const userAgent = request.header('user-agent') || ''
    const isDocClient =
      userAgent.includes('Scalar') ||
      userAgent.includes('swagger') ||
      userAgent.includes('openapi') ||
      request.header('x-documentation-client') === 'true'

    // Si c'est un client de documentation, normaliser la requête
    if (isDocClient && request.method() === 'POST') {
      try {
        // Récupérer le body brut
        const rawBody = request.raw()

        if (rawBody && typeof rawBody === 'string') {
          // Normaliser le JSON (supprimer espaces inutiles)
          const normalizedBody = JSON.stringify(JSON.parse(rawBody))

          // Recalculer le Content-Length correct
          const correctLength = Buffer.byteLength(normalizedBody, 'utf8')

          // Logger pour diagnostic
          console.log('🔧 Content-Length Fix:', {
            userAgent,
            originalLength: request.header('content-length'),
            calculatedLength: correctLength,
            bodyLength: rawBody.length
          })

          // Définir le Content-Length correct
          request.request.headers['content-length'] = correctLength.toString()
        }
      } catch (error) {
        // Continuer normalement si la normalisation échoue
        console.log('⚠️ Content-Length Fix Error:', error.message)
      }
    }

    // Ajouter des headers pour les clients de documentation
    if (isDocClient) {
      response.header('X-Content-Length-Fixed', 'true')
      response.header('X-Documentation-Friendly', 'true')
    }

    // Continuer vers le prochain middleware
    await next()
  }
}
