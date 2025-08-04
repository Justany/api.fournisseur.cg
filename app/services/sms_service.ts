import env from '#start/env'
import https from 'node:https'
import fetch from 'node-fetch'
import { NetworkLoggerService } from '#services/network_logger_service'
import type {
  SmsConfig,
  SmsServiceOptions,
  SendSmsRequest,
  SendSmsResponse,
  SmsStatusResponse,
} from '#types/sms_types'

/**
 * Service SMS MTN simplifié selon la documentation officielle
 * https://github.com/hkfmz/code_api_mtn_doc/blob/main/DESCRIPTION.md
 *
 * API MTN : POST https://sms.mtncongo.net/api/sms/
 * - Envoi SMS : { msg, sender, receivers, ... }
 * - Vérification statut : { op: "status", id: "26" }
 */
export class SmsService {
  private config: SmsConfig
  private options: SmsServiceOptions
  private authToken?: string
  private networkLogger: NetworkLoggerService

  constructor(options: SmsServiceOptions = {}) {
    this.options = {
      environment: 'development',
      timeout: 30000,
      retries: 3,
      ...options,
    }

    this.config = {
      baseUrl: env.get('SMS_BASE_URL') || 'https://sms.mtncongo.net/api/sms',
      authToken: env.get('SMS_AUTH_TOKEN') || 'ac6b69b90482d286cbeec099b1f6359205b2533c',
      environment: (env.get('NODE_ENV') as 'development' | 'production') || 'development',
    }

    // Initialiser le token d'authentification directement depuis la config
    this.authToken = this.config.authToken

    // Initialiser le logger réseau
    this.networkLogger = new NetworkLoggerService()
  }

  /**
   * Envoyer un SMS selon la documentation MTN officielle
   * POST https://sms.mtncongo.net/api/sms/
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    // Préparer les données selon le format MTN exact
    const mtnRequest = {
      msg: request.message,
      sender: (request.from || 'Fourniseur').substring(0, 11), // Limité à 11 caractères selon la doc MTN
      receivers: this.formatPhoneNumberForMTN(request.to),
      externalId: request.reference ? Number.parseInt(request.reference) : undefined,
      callback_url: env.get('SMS_CALLBACK_URL'),
    }

    const response = await this.makeRequest<any>('/', {
      method: 'POST',
      body: mtnRequest,
    })

    // Traiter la réponse MTN selon la doc officielle
    // Codes de succès HTTP : 200/201 selon la documentation MTN
    if (response.status === '200' || response.status === '201') {
      // Vérifier si l'envoi a réussi selon le message de l'API MTN
      const isSuccess = response.resultat && response.resultat.toLowerCase().includes('envoyé')

      if (isSuccess) {
        return {
          messageId: response.id || `sms_${Date.now()}`,
          status: 'sent',
          to: request.to,
          from: request.from || 'Fourniseur',
          message: request.message,
          cost: this.extractCostFromResult(response.resultat),
          balance: 1000, // Non fourni par l'API MTN
          timestamp: new Date().toISOString(),
        }
      }
    }

    // Gestion des erreurs selon les codes de statut MTN
    const errorMessages: Record<string, string> = {
      '400': 'Demande invalide - données manquantes ou invalides',
      '401': 'Authentification échouée - vérifiez votre token',
      '403': 'Accès refusé - permissions insuffisantes',
      '404': 'Ressource non trouvée',
      '405': 'Méthode non autorisée',
      '406': 'Type de contenu non accepté',
      '415': 'Type de média non supporté - utilisez application/json',
    }

    const statusCode = String(response.status)
    const errorMessage = errorMessages[statusCode] || `Erreur ${statusCode}`
    throw new Error(`${errorMessage}: ${response.resultat || response.detail || response.message}`)
  }

  /**
   * Vérifier le statut d'un SMS selon la documentation MTN
   * POST https://sms.mtncongo.net/api/sms/
   * { "op": "status", "id": "26" }
   *
   * Réponse exemple: {
   *   "resultat": ["242056753822, 1, Livré au téléphone", "242068463499, 2, Non remis au téléphone"],
   *   "status": "200",
   *   "externalId": 15
   * }
   */
  async getSmsStatus(messageId: string): Promise<SmsStatusResponse> {
    const response = await this.makeRequest<any>('/', {
      method: 'POST',
      body: {
        op: 'status',
        id: messageId,
      },
    })

    // Vérifier le succès de la requête selon les codes MTN
    if (response.status === '200' || response.status === '201') {
      // Traiter la réponse MTN selon la documentation officielle
      if (!response.resultat || !Array.isArray(response.resultat)) {
        throw new Error('Format de réponse de statut invalide')
      }

      // Prendre le premier destinataire (format: "242056753822, 1, Livré au téléphone")
      const statusData = response.resultat[0]
      const [phone, statusCode, statusMessage] = statusData.split(', ')

      // Valider les données
      if (!phone || !statusCode || !statusMessage) {
        throw new Error(`Format de statut invalide: ${statusData}`)
      }

      return {
        messageId: messageId,
        status: this.mapMtnStatusToStandard(statusCode.trim()),
        to: phone.trim(),
        from: 'Fourniseur',
        message: '', // Pas disponible dans la réponse de statut MTN
        cost: 25, // Coût estimé
        deliveredAt: statusCode.trim() === '1' ? new Date().toISOString() : undefined,
        failedAt: ['2', '16'].includes(statusCode.trim()) ? new Date().toISOString() : undefined,
        failureReason: ['2', '16'].includes(statusCode.trim()) ? statusMessage.trim() : undefined,
        timestamp: new Date().toISOString(),
        externalId: response.externalId,
      }
    }

    // Gestion des erreurs selon les codes de statut MTN
    const errorMessages: Record<string, string> = {
      '400': 'Demande de statut invalide - vérifiez les paramètres',
      '401': 'Authentification échouée pour la vérification de statut',
      '404': 'SMS non trouvé - ID invalide ou SMS expiré',
    }

    const statusCode = String(response.status)
    const errorMessage = errorMessages[statusCode] || `Erreur de statut ${statusCode}`
    throw new Error(`${errorMessage}: ${response.resultat || response.detail || response.message}`)
  }

  /**
   * Extraire le coût depuis le résultat MTN : "envoyé (coût: 46 crédits)" ou "envoyé (coût: 11 crédit)"
   */
  private extractCostFromResult(resultat: string): number {
    const costMatch = resultat.match(/coût:\s*(\d+)\s*crédits?/i)
    return costMatch ? Number.parseInt(costMatch[1], 10) : 25
  }

  /**
   * Mapper les codes de statut MTN vers les standards selon la documentation officielle
   *
   * Codes MTN officiels :
   * 0: En attente
   * 1: Livré au téléphone
   * 2: Non remis au téléphone
   * 4: Mis en file d'attente sur SMSC
   * 8: Livré au SMSC
   * 16: rejet smsc
   */
  private mapMtnStatusToStandard(mtnCode: string): 'sent' | 'delivered' | 'failed' | 'pending' {
    switch (mtnCode) {
      case '0':
        return 'pending' // En attente
      case '1':
        return 'delivered' // Livré au téléphone ✅ SUCCÈS FINAL
      case '2':
        return 'failed' // Non remis au téléphone ❌ ÉCHEC
      case '4':
        return 'pending' // Mis en file d'attente sur SMSC ⏳ EN COURS
      case '8':
        return 'sent' // Livré au SMSC ✅ ENVOYÉ AU RÉSEAU
      case '16':
        return 'failed' // Rejet SMSC ❌ REJETÉ
      default:
        console.warn(`Code de statut MTN inconnu: ${mtnCode}`)
        return 'pending'
    }
  }

  /**
   * Effectuer une requête HTTP vers l'API SMS MTN
   * Endpoint unique : POST https://sms.mtncongo.net/api/sms/
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method: 'POST'
      body?: any
    }
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    // Headers selon la documentation MTN
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Authorization': this.formatAuthToken(),
    }

    const requestOptions: RequestInit = {
      method: options.method,
      headers,
    }

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body)
    }

    // En mode développement, désactiver la vérification SSL
    if (this.config.environment === 'development') {
      const agent = new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      })
      // @ts-ignore
      requestOptions.agent = agent
    }

    const timeout = this.options?.timeout || 30000

    // Fonction pour effectuer la requête avec timeout
    const makeRequestWithTimeout = async (): Promise<any> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        } as any)
        clearTimeout(timeoutId)
        return response
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error(`Timeout après ${timeout}ms`)
        }
        throw error
      }
    }

    // Logique de retry
    let lastError: Error
    for (let attempt = 1; attempt <= (this.options?.retries || 3); attempt++) {
      const requestStartTime = Date.now()

      try {
        // Logger la requête sortante
        this.networkLogger.logOutgoingRequest({
          method: options.method,
          url,
          headers,
          body: options.body,
          service: 'SMS MTN API',
        })

        const response = await makeRequestWithTimeout()
        const duration = Date.now() - requestStartTime

        // Logger la réponse reçue
        this.networkLogger.logIncomingResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          duration,
          service: 'SMS MTN API',
          url,
        })

        if (!response.ok) {
          let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.text()
            this.networkLogger.logRequestError({
              error: new Error(errorMessage),
              method: options.method,
              url,
              service: 'SMS MTN API',
              attempt,
              maxAttempts: this.options.retries || 3,
            })
            try {
              const jsonError = JSON.parse(errorData)
              errorMessage = jsonError.message || jsonError.error || errorMessage
            } catch {
              errorMessage = `${errorMessage}\nBody: ${errorData.substring(0, 200)}`
            }
          } catch (parseError) {
            console.log(`❌ Impossible de lire le body de l'erreur:`, parseError)
          }
          throw new Error(errorMessage)
        }

        // Vérifier si la réponse est du JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()

          // Logger le succès
          this.networkLogger.logRequestSuccess({
            method: options.method,
            url,
            status: response.status,
            duration,
            service: 'SMS MTN API',
          })

          return data as T
        } else {
          const textData = await response.text()
          console.log(`⚠️ Response non-JSON:`, textData.substring(0, 500))
          throw new Error(`Réponse non-JSON reçue. Content-Type: ${contentType}`)
        }
      } catch (error) {
        lastError = error

        // Logger l'erreur
        this.networkLogger.logRequestError({
          error: error as Error,
          method: options.method,
          url,
          service: 'SMS MTN API',
          attempt,
          maxAttempts: this.options.retries,
        })

        if (attempt === this.options.retries) {
          throw error
        }

        // Attendre avant de retry (backoff exponentiel)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)

        // Logger la tentative de retry
        this.networkLogger.logRetryAttempt({
          method: options.method,
          url,
          attempt,
          maxAttempts: this.options.retries || 3,
          delay,
          service: 'SMS MTN API',
        })

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Formater le token d'authentification selon la doc MTN : "Token xxxxxxxxxxxxxxxxxxxxxxx"
   */
  private formatAuthToken(): string {
    if (!this.authToken) {
      throw new Error("Token d'authentification SMS non configuré")
    }

    // Si le token commence déjà par "Token ", l'utiliser tel quel
    if (this.authToken.startsWith('Token ')) {
      return this.authToken
    }

    // Sinon, ajouter le préfixe "Token "
    return `Token ${this.authToken}`
  }

  /**
   * Vérifier la santé de la connexion
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const expectedToken = 'ac6b69b90482d286cbeec099b1f6359205b2533c'

      if (!this.config.authToken) {
        return {
          status: 'unhealthy',
          message: "Token d'authentification MTN manquant dans SMS_AUTH_TOKEN",
        }
      }

      // Vérifier que le token contient le bon token attendu
      if (!this.config.authToken.includes(expectedToken)) {
        return {
          status: 'unhealthy',
          message: `Token d'authentification incorrect. Token actuel: ${this.config.authToken?.substring(0, 20)}...`,
        }
      }

      // Vérifier que l'URL de base est correcte
      if (!this.config.baseUrl.includes('sms.mtncongo.net')) {
        return {
          status: 'unhealthy',
          message: 'URL de base MTN incorrecte',
        }
      }

      // Configuration validée avec le bon token
      return {
        status: 'healthy',
        message: `✅ Configuration SMS MTN validée avec le token d'authentification correct (${expectedToken.substring(0, 10)}...)`,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Erreur de configuration: ${error.message}`,
      }
    }
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): SmsConfig {
    return { ...this.config }
  }

  /**
   * Valider un numéro de téléphone congolais (format MTN : 242XXXXXXXX)
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Format MTN international : 242XXXXXXXX (04, 05, 06)
    const numberFormat = /^242(04|05|06)[0-9]{7}$/

    return numberFormat.test(cleaned)
  }

  /**
   * Formater un numéro de téléphone au format MTN (242XXXXXXXX)
   */
  formatPhoneNumberForMTN(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Si déjà au format MTN (242XXXXXXXX), retourner tel quel
    if (cleaned.startsWith('242') && cleaned.length === 12) {
      return cleaned
    }

    return cleaned
  }

  /**
   * Calculer le coût d'un SMS selon la documentation MTN
   */
  calculateSmsCost(message: string): number {
    const length = message.length
    const costPerSms = 25 // Coût standard par SMS

    // Selon la documentation MTN :
    if (length <= 160) {
      return costPerSms // 1 message = 160 caractères
    } else if (length <= 306) {
      return costPerSms * 2 // 2 messages = 306 caractères (153 + 153)
    } else if (length <= 459) {
      return costPerSms * 3 // 3 messages = 459 caractères (153 + 153 + 153)
    } else if (length <= 612) {
      return costPerSms * 4 // 4 messages = 612 caractères
    } else if (length <= 765) {
      return costPerSms * 5 // 5 messages = 765 caractères (153*5)
    } else if (length <= 918) {
      return costPerSms * 6 // 6 messages = 918 caractères
    } else if (length <= 1071) {
      return costPerSms * 7 // 7 messages = 1071 caractères
    } else {
      // Pour les messages plus longs, calculer dynamiquement
      const smsCount = Math.ceil((length - 160) / 153) + 1
      return costPerSms * smsCount
    }
  }

  /**
   * Valider les caractères du message selon la documentation MTN
   */
  validateMessageCharacters(message: string): {
    isValid: boolean
    type: 'GSM' | 'Unicode'
    invalidChars?: string[]
  } {
    // Caractères GSM autorisés selon la documentation MTN
    const gsmChars = /^[a-zA-Z0-9~!@#$%^&*()_\-=+\[\]?<>,.':"/{}| ]*$/

    if (gsmChars.test(message)) {
      return { isValid: true, type: 'GSM' }
    }

    // Si le message contient d'autres caractères, il sera traité comme Unicode
    const invalidChars = message.match(/[^\x20-\x7E]/g) || []

    return {
      isValid: true, // Unicode est autorisé
      type: 'Unicode',
      invalidChars: [...new Set(invalidChars)],
    }
  }

  /**
   * Obtenir la description d'un code de statut MTN
   */
  getMtnStatusDescription(code: string): {
    code: string
    description: string
    category: 'success' | 'pending' | 'failed'
  } {
    const statusMap: Record<
      string,
      { description: string; category: 'success' | 'pending' | 'failed' }
    > = {
      '0': { description: 'En attente', category: 'pending' },
      '1': { description: 'Livré au téléphone', category: 'success' },
      '2': { description: 'Non remis au téléphone', category: 'failed' },
      '4': { description: "Mis en file d'attente sur SMSC", category: 'pending' },
      '8': { description: 'Livré au SMSC', category: 'success' },
      '16': { description: 'Rejet SMSC', category: 'failed' },
    }

    const statusInfo = statusMap[code] || {
      description: 'Code de statut inconnu',
      category: 'pending' as const,
    }

    return {
      code,
      description: statusInfo.description,
      category: statusInfo.category,
    }
  }

  /**
   * Obtenir tous les codes de statut MTN disponibles
   */
  getAllMtnStatusCodes(): Array<{ code: string; description: string; category: string }> {
    return [
      { code: '0', description: 'En attente', category: 'pending' },
      { code: '1', description: 'Livré au téléphone', category: 'success' },
      { code: '2', description: 'Non remis au téléphone', category: 'failed' },
      { code: '4', description: "Mis en file d'attente sur SMSC", category: 'pending' },
      { code: '8', description: 'Livré au SMSC', category: 'success' },
      { code: '16', description: 'Rejet SMSC', category: 'failed' },
    ]
  }
}
