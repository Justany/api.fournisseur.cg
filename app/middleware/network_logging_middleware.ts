import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
// import env from '#start/env'

/**
 * Middleware pour logger toutes les requêtes réseau en mode développement
 * Affiche les détails des requêtes HTTP sortantes avec timing et statut
 */
export default class NetworkLoggingMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const startTime = Date.now()

    // Vérifier si on est en mode développement
    // const isDevelopment = env.get('NODE_ENV') === 'development'

    // if (!isDevelopment) {
    //   await next()
    //   return
    // }

    await next()

    // Logger la requête entrante
    console.log('\n🌐 === REQUÊTE RÉSEAU ENTRANTE ===')
    console.log(`📥 ${request.method()} ${request.url(true)}`)
    console.log(`👤 User-Agent: ${request.header('user-agent') || 'Non spécifié'}`)
    console.log(`🌍 IP: ${request.ip()}`)
    console.log(`📋 Headers:`, JSON.stringify(request.headers(), null, 2))

    // Logger le body si présent
    if (request.method() !== 'GET' && request.method() !== 'HEAD') {
      try {
        const body = request.body()
        if (body && Object.keys(body).length > 0) {
          console.log(`📦 Body:`, JSON.stringify(body, null, 2))
        }
      } catch (error) {
        console.log(`⚠️ Impossible de lire le body: ${error.message}`)
      }
    }

    // Intercepter la réponse
    const originalSend = response.send.bind(response)
    response.send = function (data: any) {
      const duration = Date.now() - startTime

      console.log('\n🌐 === RÉPONSE RÉSEAU ===')
      console.log(`📤 Status: ${response.getStatus()}`)
      console.log(`⏱️ Durée: ${duration}ms`)
      console.log(`📏 Taille: ${JSON.stringify(data).length} caractères`)
      console.log(`📋 Headers de réponse:`, JSON.stringify(response.getHeaders(), null, 2))

      if (typeof data === 'object') {
        console.log(`📦 Données de réponse:`, JSON.stringify(data, null, 2))
      } else {
        console.log(`📦 Données de réponse:`, data)
      }

      console.log('🌐 === FIN REQUÊTE RÉSEAU ===\n')

      return originalSend(data)
    }

    await next()
  }
}
