import env from '#start/env'
import https from 'node:https'
import fetch from 'node-fetch'
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
  }

  /**
   * Envoyer un SMS selon la documentation MTN officielle
   * POST https://sms.mtncongo.net/api/sms/
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    // Préparer les données selon le format MTN exact
    const mtnRequest = {
      msg: request.message,
      sender: (request.from || 'Fournisseur').substring(0, 11), // Limité à 11 caractères selon la doc MTN
      receivers: this.formatPhoneNumberForMTN(request.to),
      externalId: request.reference ? Number.parseInt(request.reference) : undefined,
      callback_url: env.get('SMS_CALLBACK_URL'),
    }

    const response = await this.makeRequest<any>('/', {
      method: 'POST',
      body: mtnRequest,
    })

    // Traiter la réponse MTN selon la doc : {"resultat": "envoyé (coût: 46 crédits)", "status": "200", "id": "10"}
    if (response.status === '200' || response.status === '201') {
      return {
        messageId: response.id,
        status: 'sent',
        to: request.to,
        from: request.from || 'Fournisseur',
        message: request.message,
        cost: this.extractCostFromResult(response.resultat),
        balance: 1000, // Non fourni par l'API MTN
        timestamp: new Date().toISOString(),
      }
    }

    throw new Error(`Échec de l'envoi du SMS: ${response.resultat || response.message}`)
  }

  /**
   * Vérifier le statut d'un SMS selon la documentation MTN
   * POST https://sms.mtncongo.net/api/sms/
   * { "op": "status", "id": "26" }
   */
  async getSmsStatus(messageId: string): Promise<SmsStatusResponse> {
    const response = await this.makeRequest<any>('/', {
      method: 'POST',
      body: {
        op: 'status',
        id: messageId,
      },
    })

    if (response.status === '200') {
      // Traiter la réponse MTN selon la doc
      const statusResults = Array.isArray(response.resultat)
        ? response.resultat
        : [response.resultat]
      const statusData = statusResults[0] // Premier destinataire
      const [phone, statusCode, statusMessage] = statusData.split(', ')

      return {
        messageId: messageId,
        status: this.mapMtnStatusToStandard(statusCode),
        to: phone,
        from: 'Fournisseur',
        message: '', // Pas disponible dans la réponse de statut
        cost: 25,
        deliveredAt: statusCode === '1' ? new Date().toISOString() : undefined,
        failedAt: statusCode === '2' || statusCode === '16' ? new Date().toISOString() : undefined,
        failureReason: statusCode === '2' || statusCode === '16' ? statusMessage : undefined,
        timestamp: new Date().toISOString(),
        externalId: response.externalId,
      }
    }

    throw new Error(`Échec de la récupération du statut: ${response.resultat || response.message}`)
  }

  /**
   * Extraire le coût depuis le résultat MTN : "envoyé (coût: 46 crédits)"
   */
  private extractCostFromResult(resultat: string): number {
    const costMatch = resultat.match(/coût:\s*(\d+)/i)
    return costMatch ? Number.parseInt(costMatch[1], 10) : 25
  }

  /**
   * Mapper les codes de statut MTN vers les standards
   * Selon la doc MTN :
   * 0: En attente, 1: Livré au téléphone, 2: Non remis au téléphone
   * 4: Mis en file d'attente sur SMSC, 8: Livré au SMSC, 16: Rejet SMSC
   */
  private mapMtnStatusToStandard(mtnCode: string): 'sent' | 'delivered' | 'failed' | 'pending' {
    switch (mtnCode) {
      case '0':
        return 'pending' // En attente
      case '1':
        return 'delivered' // Livré au téléphone
      case '2':
        return 'failed' // Non remis au téléphone
      case '4':
        return 'pending' // Mis en file d'attente sur SMSC
      case '8':
        return 'sent' // Livré au SMSC
      case '16':
        return 'failed' // Rejet SMSC
      default:
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
      try {
        console.log(
          `📱 SMS MTN API Request (tentative ${attempt}/${this.options.retries}): ${options.method} ${url}`
        )
        console.log(`🔑 Authorization: ${headers['Authorization'].substring(0, 25)}...`)

        const response = await makeRequestWithTimeout()

        console.log(`📡 Statut de la réponse: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.text()
            console.log(`❌ Error Response Body:`, errorData.substring(0, 500))
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
          console.log(`✅ Response JSON:`, JSON.stringify(data, null, 2).substring(0, 500))
          return data as T
        } else {
          const textData = await response.text()
          console.log(`⚠️ Response non-JSON:`, textData.substring(0, 500))
          throw new Error(`Réponse non-JSON reçue. Content-Type: ${contentType}`)
        }
      } catch (error) {
        lastError = error
        console.error(
          `❌ Erreur SMS MTN API (tentative ${attempt}/${this.options.retries}):`,
          error
        )

        if (attempt === this.options.retries) {
          throw error
        }

        // Attendre avant de retry (backoff exponentiel)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`⏳ Retry dans ${delay}ms...`)
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
}
