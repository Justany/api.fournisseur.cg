/**
 * Types pour l'API Spaark Pay
 * Basés sur la documentation Swagger fournie
 */

export interface SpaarkPayConfig {
  baseUrl: string
  testApiKey: string
  liveApiKey: string
  token: string
  environment: 'development' | 'production'
}

export interface SpaarkPayUser {
  id: number
  email: string
  name: string
  phone: string
  testApiKey: string
  liveApiKey: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
  createdAt: string
}

export interface SpaarkPayPayment {
  id: number
  amount: number
  phone: string
  status: 'pending' | 'completed' | 'failed'
  reference: string
  externalReference?: string
  externalStatus?: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  transactionId?: string
  financial?: string
  mode: 'airtel' | 'momo'
  createdAt: string
  completedAt?: string
  verifiedExternally: boolean
  autoVerified: boolean
}

export interface SpaarkPayTransactionHistory {
  id: number
  amount: number
  phone: string
  mode: 'airtel' | 'momo'
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  reference: string
  token: string
  transactionId?: string
  createdAt: string
  completedAt?: string
  details: Record<string, any>
}

export interface SpaarkPayWhitelistedDomain {
  id: number
  domain: string
  isActive: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  validatedAt?: string
  validatedBy?: number
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  userId: number
}

export interface SpaarkPayDomainStats {
  total: number
  active: number
  pending: number
  rejected: number
}

// Types pour les requêtes
export interface InitiatePaymentRequest {
  phone: string
  amount: number
  mode: 'airtel' | 'momo'
  reference?: string
}

export interface VerifyPaymentRequest {
  token: string
  mode: 'airtel' | 'momo'
}

export interface VerifyPaymentByIdRequest {
  paymentId: number
}

export interface WebhookRequest {
  reference: string
  status: 'COMPLETED' | 'FAILED'
  transactionId: string
}

export interface AddDomainRequest {
  domain: string
}

export interface ValidateDomainRequest {
  status: 'APPROVED' | 'REJECTED'
  reason?: string
}

// Types pour les réponses
export interface SpaarkPayResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export interface InitiatePaymentResponse {
  status: number
  message: string
  paymentId: number
  token: string
  composition: string
  transID: string
}

export interface PaymentStatusResponse {
  status: 'pending' | 'completed' | 'failed'
  amount: number
  phone: string
  mode: 'airtel' | 'momo'
  reference: string
  externalReference?: string
  externalStatus?: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  transactionId?: string
  financial?: string
  responseData?: Record<string, any>
  createdAt: string
  completedAt?: string
  autoVerified: boolean
}

export interface VerifyPaymentResponse {
  paymentId: number
  status: 'pending' | 'completed' | 'failed'
  externalStatus: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  transactionId?: string
  amount: number
  financial?: string
  phone: string
  mode: 'airtel' | 'momo'
  reference: string
  externalReference: string
  createdAt: string
  completedAt?: string
  verifiedExternally: boolean
}

export interface AuthResponse {
  user: SpaarkPayUser
  token: string
}

export interface ApiKeyResponse {
  testApiKey?: string
  liveApiKey?: string
}

export interface WebhookResponse {
  received: boolean
}

export interface DomainsResponse {
  domains: SpaarkPayWhitelistedDomain[]
}

export interface DomainStatsResponse {
  total: number
  active: number
  pending: number
  rejected: number
}

// Types pour les erreurs
export interface SpaarkPayError {
  status: 'error'
  message: string
}

// Types pour les options de configuration
export interface SpaarkPayServiceOptions {
  environment?: 'development' | 'production'
  timeout?: number
  retries?: number
}
