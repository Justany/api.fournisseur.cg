import env from '#start/env'
import https from 'node:https'
import fetch from 'node-fetch'
import type {
  SmsConfig,
  SmsServiceOptions,
  SmsResponse,
  SendSmsRequest,
  SendSmsResponse,
  SmsStatusResponse,
  SmsHistoryResponse,
  SmsStatsResponse,
  SmsAuthResponse,
  SmsWebhookRequest,
  SmsWebhookResponse,
  SmsWebhookConfig,
  SmsWebhookConfigResponse,
} from '#types/sms_types'

/**
 * Service pour l'API SMS
 * Encapsule toutes les fonctionnalités d'envoi et de gestion des SMS
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
      apiKey: env.get('SMS_API_KEY') || 'sms_api_key_here',
      authToken: env.get('SMS_AUTH_TOKEN') || 'Token EJQ15pg5cEYsotgQaGyCHRxnPvmAemamOh6w7YRDif',
      environment: (env.get('NODE_ENV') as 'development' | 'production') || 'development',
    }

    // Initialiser le token d'authentification directement depuis la config
    this.authToken = this.config.authToken
  }

  /**
   * Authentification avec l'API SMS MTN
   * L'API MTN utilise un token statique fourni dans les headers
   */
  async authenticate(): Promise<SmsAuthResponse> {
    // L'API MTN utilise un token statique, pas d'authentification dynamique
    this.authToken = this.config.authToken

    return {
      token: this.authToken,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
      user: {
        id: 'mtn_user',
        username: 'mtn_api_user',
        balance: 1000,
        status: 'active',
      },
    }
  }

  /**
   * Envoyer un SMS selon la documentation MTN
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    // Préparer les données selon le format MTN
    const mtnRequest = {
      msg: request.message,
      sender: request.from || 'Fourniseur',
      receivers: request.to,
      externalId: request.reference ? Number.parseInt(request.reference) : undefined,
      callback_url: env.get('SMS_CALLBACK_URL'),
    }

    const response = await this.makeRequest<any>('/send', {
      method: 'POST',
      body: mtnRequest,
      requiresAuth: true,
    })

    // Traiter la réponse MTN
    if (response.status === '200' || response.status === '201') {
      return {
        messageId: response.id,
        status: 'sent',
        to: request.to,
        from: request.from || 'Fourniseur',
        message: request.message,
        cost: this.extractCostFromResult(response.resultat),
        balance: 1000, // À récupérer via une API séparée
        timestamp: new Date().toISOString(),
      }
    }

    throw new Error(`Échec de l'envoi du SMS: ${response.resultat || response.message}`)
  }

  /**
   * Extraire le coût depuis le résultat MTN
   */
  private extractCostFromResult(resultat: string): number {
    const costMatch = resultat.match(/coût:\s*(\d+)/i)
    return costMatch ? Number.parseInt(costMatch[1], 10) : 25
  }

  /**
   * Vérifier le statut d'un SMS selon la documentation MTN
   */
  async getSmsStatus(messageId: string): Promise<SmsStatusResponse> {
    const response = await this.makeRequest<any>('/send', {
      method: 'POST',
      body: {
        op: 'status',
        id: messageId,
      },
      requiresAuth: true,
    })

    if (response.status === '200') {
      // Traiter la réponse MTN qui contient un tableau de statuts
      const statusData = response.resultat[0] // Premier destinataire
      const [phone, statusCode, statusMessage] = statusData.split(', ')

      return {
        messageId: messageId,
        status: this.mapMtnStatusToStandard(statusCode),
        to: phone,
        from: 'Fourniseur',
        message: '', // Pas disponible dans la réponse de statut
        cost: 25,
        deliveredAt: statusCode === '1' ? new Date().toISOString() : undefined,
        failedAt: statusCode === '2' ? new Date().toISOString() : undefined,
        failureReason: statusCode === '2' ? statusMessage : undefined,
        timestamp: new Date().toISOString(),
      }
    }

    throw new Error(`Échec de la récupération du statut: ${response.resultat || response.message}`)
  }

  /**
   * Mapper les codes de statut MTN vers les standards
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
   * Récupérer l'historique des SMS
   */
  async getSmsHistory(page: number = 1, limit: number = 50): Promise<SmsHistoryResponse> {
    const response = await this.makeRequest<SmsResponse<SmsHistoryResponse>>(
      `/sms/history?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération de l'historique: ${response.message}`)
  }

  /**
   * Récupérer les statistiques des SMS
   */
  async getSmsStats(startDate?: string, endDate?: string): Promise<SmsStatsResponse> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const response = await this.makeRequest<SmsResponse<SmsStatsResponse>>(
      `/sms/stats?${params.toString()}`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération des statistiques: ${response.message}`)
  }

  /**
   * Traiter un webhook SMS
   */
  async processWebhook(webhook: SmsWebhookRequest): Promise<SmsWebhookResponse> {
    const response = await this.makeRequest<SmsResponse<SmsWebhookResponse>>('/sms/webhook', {
      method: 'POST',
      body: webhook,
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec du traitement du webhook: ${response.message}`)
  }

  /**
   * Configurer un webhook SMS
   */
  async configureWebhook(config: SmsWebhookConfig): Promise<SmsWebhookConfigResponse> {
    const response = await this.makeRequest<SmsResponse<SmsWebhookConfigResponse>>(
      '/sms/webhook/config',
      {
        method: 'POST',
        body: config,
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la configuration du webhook: ${response.message}`)
  }

  /**
   * Effectuer une requête HTTP vers l'API SMS avec retry et timeout
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: any
      requiresAuth?: boolean
    }
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (options.requiresAuth) {
      if (!this.authToken) {
        await this.ensureAuthenticated()
      }
      // Format MTN : Token-xxxxxxxxxxxxxxxx
      headers['Authorization'] =
        this.authToken && this.authToken.startsWith('Token ')
          ? this.authToken
          : `Token ${this.authToken || ''}`
    } else {
      // Utiliser la clé API
      headers['x-api-key'] = this.config.apiKey
    }

    const requestOptions: RequestInit = {
      method: options.method,
      headers,
    }

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body)
    }

    // En mode développement, désactiver la vérification SSL pour éviter les erreurs de certificat
    if (this.config.environment === 'development') {
      // Configurer l'agent HTTPS pour ignorer les erreurs de certificat
      const agent = new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      })

      // Utiliser node-fetch avec l'agent HTTPS
      // @ts-ignore
      requestOptions.agent = agent
    }

    // Appliquer le timeout depuis les options du service
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
          `📱 SMS API Request (tentative ${attempt}/${this.options.retries}): ${options.method} ${url}`
        )
        console.log(`🔑 Auth Token: ${this.authToken ? 'Présent' : 'Absent'}`)
        console.log(`🔑 Clé API: ${headers['x-api-key'] ? 'Présente' : 'Absente'}`)

        const response = await makeRequestWithTimeout()

        console.log(`📡 Statut de la réponse: ${response.status} ${response.statusText}`)
        console.log(`📡 En-têtes de la réponse:`, Object.fromEntries(response.headers.entries()))

        // Vérifier le type de contenu
        const contentType = response.headers.get('content-type')
        console.log(`📄 Content-Type: ${contentType}`)

        if (!response.ok) {
          let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`

          try {
            const errorData = await response.text()
            console.log(`❌ Error Response Body:`, errorData.substring(0, 500))

            // Essayer de parser comme JSON
            try {
              const jsonError = JSON.parse(errorData)
              errorMessage = jsonError.message || jsonError.error || errorMessage
            } catch {
              // Si ce n'est pas du JSON, utiliser le texte brut
              errorMessage = `${errorMessage}\nBody: ${errorData.substring(0, 200)}`
            }
          } catch (parseError) {
            console.log(`❌ Impossible de lire le body de l'erreur:`, parseError)
          }

          throw new Error(errorMessage)
        }

        // Vérifier si la réponse est du JSON
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.log(`✅ Response JSON:`, JSON.stringify(data, null, 2).substring(0, 500))
          return data as T
        } else {
          // Si ce n'est pas du JSON, lire comme texte
          const textData = await response.text()
          console.log(`⚠️ Response non-JSON:`, textData.substring(0, 500))

          // Si c'est du HTML, c'est probablement une page d'erreur
          if (contentType && contentType.includes('text/html')) {
            throw new Error(
              `Page HTML reçue au lieu de JSON. L'endpoint ${endpoint} n'existe probablement pas sur l'API MTN.`
            )
          }

          throw new Error(
            `Réponse non-JSON reçue. Content-Type: ${contentType}. Body: ${textData.substring(0, 200)}`
          )
        }
      } catch (error) {
        lastError = error
        console.error(
          `❌ Erreur SMS API (tentative ${attempt}/${this.options.retries}) (${endpoint}):`,
          error
        )

        // Si c'est la dernière tentative, ne pas retry
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
   * S'assurer d'être authentifié avec l'API SMS
   */
  private async ensureAuthenticated(): Promise<void> {
    if (this.authToken) {
      return // Déjà authentifié
    }

    // Utiliser le token configuré
    this.authToken = this.config.authToken
  }

  /**
   * Vérifier la santé de la connexion
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // L'API MTN n'a pas d'endpoint de health check public
      // On vérifie juste que la configuration est correcte
      if (
        !this.config.authToken ||
        this.config.authToken === 'Token EJQ15pg5cEYsotgQaGyCHRxnPvmAemamOh6w7YRDif'
      ) {
        return {
          status: 'unhealthy',
          message: "Token d'authentification MTN non configuré",
        }
      }

      // Vérifier que l'URL de base est correcte
      if (!this.config.baseUrl.includes('sms.mtncongo.net')) {
        return {
          status: 'unhealthy',
          message: 'URL de base MTN incorrecte',
        }
      }

      // Pour l'instant, on considère que la configuration est correcte
      // La vraie vérification se fera lors de l'envoi du premier SMS
      return {
        status: 'healthy',
        message: 'Configuration SMS MTN correcte (vérification lors du premier envoi)',
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
   * Obtenir les options du service
   */
  getOptions(): SmsServiceOptions {
    return { ...this.options }
  }

  /**
   * Définir le token d'authentification
   */
  setAuthToken(token: string): void {
    this.authToken = token
  }

  /**
   * Effacer le token d'authentification
   */
  clearAuthToken(): void {
    this.authToken = undefined
  }

  /**
   * Valider un numéro de téléphone congolais
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^0[5-7][0-9]{7}$/
    return phoneRegex.test(phoneNumber)
  }

  /**
   * Calculer le coût d'un SMS basé sur sa longueur
   */
  calculateSmsCost(message: string): number {
    const length = message.length
    if (length <= 160) {
      return 25 // Coût standard pour 1 SMS
    } else {
      const smsCount = Math.ceil(length / 160)
      return smsCount * 25
    }
  }

  /**
   * Formater un numéro de téléphone pour l'envoi
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Supprimer les espaces et caractères spéciaux
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // S'assurer qu'il commence par 0
    if (cleaned.startsWith('242')) {
      return cleaned.replace('242', '0')
    }

    return cleaned
  }

  /**
   * Vérifier le solde du compte SMS
   */
  async checkBalance(): Promise<{ balance: number; currency: string }> {
    const response = await this.makeRequest<SmsResponse<{ balance: number; currency: string }>>(
      '/account/balance',
      {
        method: 'GET',
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération du solde: ${response.message}`)
  }

  /**
   * Envoyer un SMS de test
   */
  async sendTestSms(to: string): Promise<SendSmsResponse> {
    const testMessage = 'Test SMS - API Fournisseur CG - ' + new Date().toISOString()

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message: testMessage,
      from: 'Fourniseur',
      reference: 'TEST_' + Date.now(),
      priority: 'normal',
    })
  }

  /**
   * Envoyer un SMS de vérification avec code OTP
   */
  async sendOtpSms(to: string, code: string, expiresIn: number = 5): Promise<SendSmsResponse> {
    const message = `Votre code de vérification est ${code}. Valide ${expiresIn} minutes. Ne partagez pas ce code.`

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message,
      from: 'Fourniseur',
      reference: 'OTP_' + Date.now(),
      priority: 'high',
    })
  }

  /**
   * Envoyer un SMS de notification
   */
  async sendNotificationSms(to: string, title: string, message: string): Promise<SendSmsResponse> {
    const fullMessage = `${title}: ${message}`

    return this.sendSms({
      to: this.formatPhoneNumber(to),
      message: fullMessage,
      from: 'Fourniseur',
      reference: 'NOTIF_' + Date.now(),
      priority: 'normal',
    })
  }

  /**
   * Récupérer les logs détaillés des SMS
   */
  async getDetailedLogs(
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<{
    logs: Array<{
      id: string
      messageId: string
      to: string
      from: string
      message: string
      status: string
      cost: number
      createdAt: string
      deliveredAt?: string
      failedAt?: string
      failureReason?: string
      gatewayResponse?: string
    }>
    total: number
  }> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (status) params.append('status', status)

    const response = await this.makeRequest<
      SmsResponse<{
        logs: any[]
        total: number
      }>
    >(`/sms/logs?${params.toString()}`, {
      method: 'GET',
      requiresAuth: true,
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération des logs: ${response.message}`)
  }

  /**
   * Vérifier si l'API SMS est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck()
      return health.status === 'healthy'
    } catch {
      return false
    }
  }

  /**
   * Obtenir les informations de l'API SMS
   */
  async getApiInfo(): Promise<{
    version: string
    features: string[]
    limits: {
      maxMessageLength: number
      maxRecipients: number
      rateLimit: number
    }
  }> {
    const response = await this.makeRequest<
      SmsResponse<{
        version: string
        features: string[]
        limits: {
          maxMessageLength: number
          maxRecipients: number
          rateLimit: number
        }
      }>
    >('/api/info', {
      method: 'GET',
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération des informations API: ${response.message}`)
  }
}
