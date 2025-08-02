import env from '#start/env'
import type {
  SpaarkPayConfig,
  SpaarkPayServiceOptions,
  SpaarkPayResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentStatusResponse,
  SpaarkPayTransactionHistory,
  SpaarkPayWhitelistedDomain,
  SpaarkPayDomainStats,
  AddDomainRequest,
  ValidateDomainRequest,
  WebhookRequest,
  WebhookResponse,
  AuthResponse,
  ApiKeyResponse,
  DomainsResponse,
} from '#types/spaark_pay_types'

/**
 * Service pour l'API Spaark Pay
 * Encapsule toutes les fonctionnalités de paiement mobile money
 */
export class SpaarkPayService {
  private config: SpaarkPayConfig
  private options: SpaarkPayServiceOptions
  private authToken?: string

  constructor(options: SpaarkPayServiceOptions = {}) {
    console.log('🚀 SpaarkPayService constructor called ' + options)
    this.options = {
      environment: 'development',
      timeout: 30000,
      retries: 3,
      ...options,
    }

    this.config = {
      baseUrl: env.get('SPAARK_PAY_BASE_URL') || 'https://spaark-payapi.vercel.app/api',
      testApiKey: env.get('SPAARK_PAY_TEST_API_KEY') || 'tk_test_E7rQ4wTKuOtMBylBC-vfjIxJJGRwSCGk',
      liveApiKey: env.get('SPAARK_PAY_LIVE_API_KEY') || 'tk_live_7Grd6sQR8H7wBJK-_vCJyxIMdYMDQ3Pt',
      token:
        env.get('SPAARK_PAY_TOKEN') ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUzMjY5MzM2LCJleHAiOjE3Njg4MjEzMzZ9.rTTRB-2Ge_e1ELkukHfVPW-xUJ9k9Te_wqcQRs07rzw',
      environment: (env.get('NODE_ENV') as 'development' | 'production') || 'development',
    }

    // Initialiser le token d'authentification directement depuis la config
    if (this.config.token) {
      this.authToken = this.config.token
    }
  }

  /**
   * Authentification avec l'API Spaark Pay
   */
  async authenticate(email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    if (response.status === 'success' && response.data) {
      this.authToken = response.data.token
      return response.data
    }

    throw new Error("Échec de l'authentification Spaark Pay")
  }

  /**
   * Initier un paiement
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<InitiatePaymentResponse>>(
      '/payment/initiate',
      {
        method: 'POST',
        body: request,
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de l'initiation du paiement: ${response.message}`)
  }

  /**
   * Obtenir le statut d'un paiement avec vérification automatique
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<PaymentStatusResponse>>(
      `/payment/status/${paymentId}`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération du statut: ${response.message}`)
  }

  /**
   * Vérifier un paiement par token (vérification externe forcée)
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<VerifyPaymentResponse>>(
      '/payment/verify',
      {
        method: 'POST',
        body: request,
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la vérification du paiement: ${response.message}`)
  }

  /**
   * Vérifier un paiement par ID (vérification externe forcée)
   */
  async verifyPaymentById(paymentId: number): Promise<VerifyPaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<VerifyPaymentResponse>>(
      '/payment/verify-by-id',
      {
        method: 'POST',
        body: { paymentId },
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la vérification du paiement: ${response.message}`)
  }

  /**
   * Traiter un webhook de paiement
   */
  async processWebhook(webhook: WebhookRequest): Promise<WebhookResponse> {
    const response = await this.makeRequest<WebhookResponse>('/payment/webhook', {
      method: 'POST',
      body: webhook,
    })

    return response
  }

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactionHistory(): Promise<SpaarkPayTransactionHistory[]> {
    const response = await this.makeRequest<{
      status: number
      data: SpaarkPayTransactionHistory[]
    }>('/payment/transactions', {
      method: 'GET',
      requiresAuth: true,
    })

    if (response.status === 200 && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération de l'historique: ${response.status}`)
  }

  /**
   * Récupérer la liste des domaines
   */
  async getDomains(): Promise<SpaarkPayWhitelistedDomain[]> {
    const response = await this.makeRequest<SpaarkPayResponse<DomainsResponse>>('/domains', {
      method: 'GET',
      requiresAuth: true,
    })

    if (response.status === 'success' && response.data) {
      return response.data.domains
    }

    throw new Error(`Échec de la récupération des domaines: ${response.message}`)
  }

  /**
   * Ajouter un nouveau domaine
   */
  async addDomain(request: AddDomainRequest): Promise<SpaarkPayWhitelistedDomain> {
    const response = await this.makeRequest<
      SpaarkPayResponse<{ domain: SpaarkPayWhitelistedDomain }>
    >('/domains/new', {
      method: 'POST',
      body: request,
      requiresAuth: true,
    })

    if (response.status === 'success' && response.data) {
      return response.data.domain
    }

    throw new Error(`Échec de l'ajout du domaine: ${response.message}`)
  }

  /**
   * Valider ou rejeter un domaine (ADMIN uniquement)
   */
  async validateDomain(
    domainId: number,
    request: ValidateDomainRequest
  ): Promise<SpaarkPayWhitelistedDomain> {
    const response = await this.makeRequest<
      SpaarkPayResponse<{ domain: SpaarkPayWhitelistedDomain }>
    >(`/domains/${domainId}/validate`, {
      method: 'PATCH',
      body: request,
      requiresAuth: true,
    })

    if (response.status === 'success' && response.data) {
      return response.data.domain
    }

    throw new Error(`Échec de la validation du domaine: ${response.message}`)
  }

  /**
   * Récupérer les statistiques des domaines
   */
  async getDomainStats(): Promise<SpaarkPayDomainStats> {
    const response = await this.makeRequest<SpaarkPayResponse<SpaarkPayDomainStats>>(
      '/domains/stats',
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
   * Générer une nouvelle clé API
   */
  async generateApiKey(type: 'test' | 'live'): Promise<ApiKeyResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<ApiKeyResponse>>(
      `/users/api-key/${type}`,
      {
        method: 'POST',
        requiresAuth: true,
      }
    )

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la génération de la clé API: ${response.message}`)
  }

  /**
   * Effectuer une requête HTTP vers l'API Spaark Pay
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
      headers['Authorization'] = `Bearer ${this.authToken}`
    } else {
      // Utiliser la clé API appropriée
      const apiKey =
        this.config.environment === 'production' ? this.config.liveApiKey : this.config.testApiKey
      headers['x-api-key'] = apiKey
    }

    const requestOptions: RequestInit = {
      method: options.method,
      headers,
    }

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body)
    }

    try {
      console.log(`🌐 Spaark Pay API Request: ${options.method} ${url}`)
      console.log(`🔑 Auth Token: ${this.authToken ? 'Présent' : 'Absent'}`)
      console.log(`🔑 API Key: ${headers['x-api-key'] ? 'Présente' : 'Absente'}`)

      const response = await fetch(url, requestOptions)

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`)
      console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()))

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
        throw new Error(
          `Réponse non-JSON reçue. Content-Type: ${contentType}. Body: ${textData.substring(0, 200)}`
        )
      }
    } catch (error) {
      console.error(`❌ Erreur Spaark Pay API (${endpoint}):`, error)
      throw error
    }
  }

  /**
   * S'assurer d'être authentifié avec l'API Spaark Pay
   */
  private async ensureAuthenticated(): Promise<void> {
    if (this.authToken) {
      return // Déjà authentifié
    }

    // Si pas de token dans la config, essayer de s'authentifier avec email/password
    if (!this.config.token) {
      try {
        const email = env.get('SPAARK_PAY_EMAIL') || 'admin@spaark.cg'
        const password = env.get('SPAARK_PAY_PASSWORD') || 'admin123'

        await this.authenticate(email, password)
      } catch (error) {
        throw new Error(
          `Token d'authentification requis mais non disponible. Échec de l'authentification automatique: ${error.message}`
        )
      }
    } else {
      // Utiliser le token configuré
      this.authToken = this.config.token
    }
  }

  /**
   * Vérifier la santé de la connexion
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Test simple avec la route /domains qui nécessite une authentification
      await this.makeRequest('/domains', {
        method: 'GET',
        requiresAuth: true,
      })

      return {
        status: 'healthy',
        message: 'Connexion à Spaark Pay API établie',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Erreur de connexion: ${error.message}`,
      }
    }
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): SpaarkPayConfig {
    return { ...this.config }
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
}
