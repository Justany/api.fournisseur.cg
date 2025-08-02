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
  ApiKeyResponse
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
    this.options = {
      environment: 'development',
      timeout: 30000,
      retries: 3,
      ...options
    }

    this.config = {
      baseUrl: env.get('SPAARK_PAY_BASE_URL') || 'https://spaark-payapi.vercel.app/api',
      testApiKey: env.get('SPAARK_PAY_TEST_API_KEY') || 'tk_test_E7rQ4wTKuOtMBylBC-vfjIxJJGRwSCGk',
      liveApiKey: env.get('SPAARK_PAY_LIVE_API_KEY') || 'tk_live_7Grd6sQR8H7wBJK-_vCJyxIMdYMDQ3Pt',
      token: env.get('SPAARK_PAY_TOKEN') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUzMjY5MzM2LCJleHAiOjE3Njg4MjEzMzZ9.rTTRB-2Ge_e1ELkukHfVPW-xUJ9k9Te_wqcQRs07rzw',
      environment: (env.get('NODE_ENV') as 'development' | 'production') || 'development'
    }
  }

  /**
   * Authentification avec l'API Spaark Pay
   */
  async authenticate(email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    if (response.status === 'success' && response.data) {
      this.authToken = response.data.token
      return response.data
    }

    throw new Error('Échec de l\'authentification Spaark Pay')
  }

  /**
   * Initier un paiement
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<InitiatePaymentResponse>>('/payment/initiate', {
      method: 'POST',
      body: request,
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de l'initiation du paiement: ${response.message}`)
  }

  /**
   * Obtenir le statut d'un paiement avec vérification automatique
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<PaymentStatusResponse>>(`/payment/status/${paymentId}`, {
      method: 'GET',
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération du statut: ${response.message}`)
  }

  /**
   * Vérifier un paiement par token (vérification externe forcée)
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<VerifyPaymentResponse>>('/payment/verify', {
      method: 'POST',
      body: request,
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la vérification du paiement: ${response.message}`)
  }

  /**
   * Vérifier un paiement par ID (vérification externe forcée)
   */
  async verifyPaymentById(paymentId: number): Promise<VerifyPaymentResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<VerifyPaymentResponse>>('/payment/verify-by-id', {
      method: 'POST',
      body: { paymentId },
      requiresAuth: true
    })

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
      body: webhook
    })

    return response
  }

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactionHistory(): Promise<SpaarkPayTransactionHistory[]> {
    const response = await this.makeRequest<SpaarkPayResponse<{ data: SpaarkPayTransactionHistory[] }>>('/payment/transactions', {
      method: 'GET',
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data.data
    }

    throw new Error(`Échec de la récupération de l'historique: ${response.message}`)
  }

  /**
   * Récupérer la liste des domaines
   */
  async getDomains(): Promise<SpaarkPayWhitelistedDomain[]> {
    const response = await this.makeRequest<SpaarkPayResponse<DomainsResponse>>('/domains', {
      method: 'GET',
      requiresAuth: true
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
    const response = await this.makeRequest<SpaarkPayResponse<{ domain: SpaarkPayWhitelistedDomain }>>('/domains/new', {
      method: 'POST',
      body: request,
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data.domain
    }

    throw new Error(`Échec de l'ajout du domaine: ${response.message}`)
  }

  /**
   * Valider ou rejeter un domaine (ADMIN uniquement)
   */
  async validateDomain(domainId: number, request: ValidateDomainRequest): Promise<SpaarkPayWhitelistedDomain> {
    const response = await this.makeRequest<SpaarkPayResponse<{ domain: SpaarkPayWhitelistedDomain }>>(`/domains/${domainId}/validate`, {
      method: 'PATCH',
      body: request,
      requiresAuth: true
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
    const response = await this.makeRequest<SpaarkPayResponse<SpaarkPayDomainStats>>('/domains/stats', {
      method: 'GET',
      requiresAuth: true
    })

    if (response.status === 'success' && response.data) {
      return response.data
    }

    throw new Error(`Échec de la récupération des statistiques: ${response.message}`)
  }

  /**
   * Générer une nouvelle clé API
   */
  async generateApiKey(type: 'test' | 'live'): Promise<ApiKeyResponse> {
    const response = await this.makeRequest<SpaarkPayResponse<ApiKeyResponse>>(`/users/api-key/${type}`, {
      method: 'POST',
      requiresAuth: true
    })

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
      'Content-Type': 'application/json'
    }

    // Ajouter l'authentification si nécessaire
    if (options.requiresAuth) {
      if (!this.authToken) {
        throw new Error('Token d\'authentification requis mais non disponible')
      }
      headers['Authorization'] = `Bearer ${this.authToken}`
    } else {
      // Utiliser la clé API appropriée
      const apiKey = this.config.environment === 'production'
        ? this.config.liveApiKey
        : this.config.testApiKey
      headers['x-api-key'] = apiKey
    }

    const requestOptions: RequestInit = {
      method: options.method,
      headers,
      timeout: this.options.timeout
    }

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, requestOptions)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${data.message || 'Erreur inconnue'}`)
      }

      return data as T
    } catch (error) {
      console.error(`Erreur Spaark Pay API (${endpoint}):`, error)
      throw error
    }
  }

  /**
   * Vérifier la santé de la connexion
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Test simple avec la route /domains qui ne nécessite pas d'auth
      await this.makeRequest('/domains', {
        method: 'GET'
      })

      return {
        status: 'healthy',
        message: 'Connexion à Spaark Pay API établie'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Erreur de connexion: ${error.message}`
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
