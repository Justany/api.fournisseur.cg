import env from '#start/env'

/**
 * Service pour logger les requêtes HTTP sortantes en mode développement
 * Utilisé par les services qui font des appels API externes
 */
export class NetworkLoggerService {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = env.get('NODE_ENV') === 'development'
  }

  /**
   * Logger une requête HTTP sortante
   */
  logOutgoingRequest(options: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
    service?: string
  }) {
    if (!this.isDevelopment) return

    console.log('\n🚀 === REQUÊTE HTTP SORTANTE ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    console.log(`📤 ${options.method} ${options.url}`)

    if (options.headers) {
      // Masquer les tokens sensibles dans les logs
      const safeHeaders = { ...options.headers }
      if (safeHeaders.Authorization) {
        safeHeaders.Authorization = `${safeHeaders.Authorization.substring(0, 25)}...`
      }
      if (safeHeaders['x-api-key']) {
        safeHeaders['x-api-key'] = `${safeHeaders['x-api-key'].substring(0, 10)}...`
      }

      console.log(`📋 Headers:`, JSON.stringify(safeHeaders, null, 2))
    }

    if (options.body) {
      console.log(`📦 Body:`, JSON.stringify(options.body, null, 2))
    }
  }

  /**
   * Logger une réponse HTTP reçue
   */
  logIncomingResponse(options: {
    status: number
    statusText: string
    headers?: Record<string, string>
    body?: any
    duration: number
    service?: string
    url?: string
  }) {
    if (!this.isDevelopment) return

    console.log('\n📥 === RÉPONSE HTTP REÇUE ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    if (options.url) {
      console.log(`🔗 URL: ${options.url}`)
    }
    console.log(`📊 Status: ${options.status} ${options.statusText}`)
    console.log(`⏱️ Durée: ${options.duration}ms`)

    if (options.headers) {
      console.log(`📋 Headers:`, JSON.stringify(options.headers, null, 2))
    }

    if (options.body) {
      // Limiter la taille du body dans les logs
      const bodyStr = JSON.stringify(options.body, null, 2)
      if (bodyStr.length > 1000) {
        console.log(`📦 Body (tronqué):`, bodyStr.substring(0, 1000) + '...')
      } else {
        console.log(`📦 Body:`, bodyStr)
      }
    }

    console.log('📥 === FIN RÉPONSE HTTP ===\n')
  }

  /**
   * Logger une erreur de requête HTTP
   */
  logRequestError(options: {
    error: Error
    method: string
    url: string
    service?: string
    attempt?: number
    maxAttempts?: number
  }) {
    if (!this.isDevelopment) return

    console.log('\n❌ === ERREUR REQUÊTE HTTP ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    console.log(`📤 ${options.method} ${options.url}`)
    if (options.attempt && options.maxAttempts) {
      console.log(`🔄 Tentative: ${options.attempt}/${options.maxAttempts}`)
    }
    console.log(`💥 Erreur: ${options.error.message}`)
    console.log(`📚 Stack: ${options.error.stack}`)
    console.log('❌ === FIN ERREUR REQUÊTE HTTP ===\n')
  }

  /**
   * Logger un timeout de requête
   */
  logRequestTimeout(options: {
    method: string
    url: string
    timeout: number
    service?: string
  }) {
    if (!this.isDevelopment) return

    console.log('\n⏰ === TIMEOUT REQUÊTE HTTP ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    console.log(`📤 ${options.method} ${options.url}`)
    console.log(`⏰ Timeout après ${options.timeout}ms`)
    console.log('⏰ === FIN TIMEOUT REQUÊTE HTTP ===\n')
  }

  /**
   * Logger une tentative de retry
   */
  logRetryAttempt(options: {
    method: string
    url: string
    attempt: number
    maxAttempts: number
    delay: number
    service?: string
  }) {
    if (!this.isDevelopment) return

    console.log('\n🔄 === RETRY REQUÊTE HTTP ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    console.log(`📤 ${options.method} ${options.url}`)
    console.log(`🔄 Tentative ${options.attempt}/${options.maxAttempts}`)
    console.log(`⏳ Délai: ${options.delay}ms`)
    console.log('🔄 === FIN RETRY REQUÊTE HTTP ===\n')
  }

  /**
   * Logger un succès de requête
   */
  logRequestSuccess(options: {
    method: string
    url: string
    status: number
    duration: number
    service?: string
  }) {
    if (!this.isDevelopment) return

    console.log('\n✅ === SUCCÈS REQUÊTE HTTP ===')
    console.log(`🔗 Service: ${options.service || 'API Externe'}`)
    console.log(`📤 ${options.method} ${options.url}`)
    console.log(`✅ Status: ${options.status}`)
    console.log(`⏱️ Durée: ${options.duration}ms`)
    console.log('✅ === FIN SUCCÈS REQUÊTE HTTP ===\n')
  }
}
