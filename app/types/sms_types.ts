/**
 * Types pour l'API SMS
 * Basés sur la documentation SMS fournie
 */

export interface SmsConfig {
  baseUrl: string
  apiKey: string
  authToken: string
  environment: 'development' | 'production'
}

export interface SmsServiceOptions {
  environment?: 'development' | 'production'
  timeout?: number
  retries?: number
}

export interface SmsResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  code?: string
}

// Types pour l'envoi de SMS
export interface SendSmsRequest {
  to: string
  message: string
  from?: string
  reference?: string
  priority?: 'low' | 'normal' | 'high'
}

export interface SendSmsResponse {
  messageId: string
  status: 'sent' | 'delivered' | 'failed'
  to: string
  from: string
  message: string
  cost: number
  balance: number
  timestamp: string
}

// Types pour la vérification de statut
export interface SmsStatusRequest {
  messageId: string
}

export interface SmsStatusResponse {
  messageId: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  to: string
  from: string
  message: string
  cost: number
  deliveredAt?: string
  failedAt?: string
  failureReason?: string
  timestamp: string
}

// Types pour l'historique des SMS
export interface SmsHistoryResponse {
  messages: SmsMessage[]
  total: number
  page: number
  limit: number
}

export interface SmsMessage {
  id: string
  to: string
  from: string
  message: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  cost: number
  createdAt: string
  deliveredAt?: string
  failedAt?: string
  failureReason?: string
  reference?: string
}

// Types pour les statistiques
export interface SmsStatsResponse {
  total: number
  sent: number
  delivered: number
  failed: number
  pending: number
  totalCost: number
  balance: number
  period: {
    start: string
    end: string
  }
}

// Types pour l'authentification
export interface SmsAuthResponse {
  token: string
  expiresAt: string
  user: {
    id: string
    username: string
    balance: number
    status: 'active' | 'inactive'
  }
}

// Types pour les webhooks
export interface SmsWebhookRequest {
  messageId: string
  status: 'delivered' | 'failed'
  to: string
  from: string
  timestamp: string
  failureReason?: string
}

export interface SmsWebhookResponse {
  received: boolean
  processed: boolean
}

// Types pour les erreurs
export interface SmsError {
  code: string
  message: string
  details?: string
}

// Types pour la configuration des webhooks
export interface SmsWebhookConfig {
  url: string
  events: ('delivered' | 'failed')[]
  secret?: string
}

export interface SmsWebhookConfigResponse {
  id: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}
