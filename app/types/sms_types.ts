/**
 * Types pour l'API SMS MTN simplifiée
 * Basés sur la documentation officielle MTN :
 * https://github.com/hkfmz/code_api_mtn_doc/blob/main/DESCRIPTION.md
 */

export interface SmsConfig {
  baseUrl: string
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

// Types pour l'envoi de SMS selon la documentation MTN
export interface SendSmsRequest {
  to: string // Numéro destinataire format MTN : 242XXXXXXXX
  message: string // Contenu du message SMS
  from?: string // Nom expéditeur (max 11 caractères)
  reference?: string // Référence externe pour le suivi
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

// Types pour la vérification de statut selon la documentation MTN
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
  externalId?: string | number
}

// Types de réponse MTN selon la documentation officielle
export interface MTNSmsResponse {
  resultat: string // "envoyé (coût: 46 crédits)" ou message d'erreur
  status: string // "200", "404", etc.
  id?: string // Identifiant unique serveur
  detail?: string // Détails de l'erreur si applicable
  externalId?: number // Identifiant externe du client
}

// Types pour la vérification de statut MTN
export interface MTNStatusRequest {
  op: 'status'
  id: string // ID du message
}

export interface MTNStatusResponse {
  resultat: string[] // ["242056753822, 1, Livré au téléphone", "242068463499, 2, Non remis au téléphone"]
  status: string // "200"
  externalId?: number
}

// Codes de statut MTN selon la documentation
export type MTNStatusCode = '0' | '1' | '2' | '4' | '8' | '16'

export interface MTNStatusMapping {
  '0': 'En attente'
  '1': 'Livré au téléphone'
  '2': 'Non remis au téléphone'
  '4': "Mis en file d'attente sur SMSC"
  '8': 'Livré au SMSC'
  '16': 'Rejet SMSC'
}

// Types pour la validation des messages selon la doc MTN
export interface MessageValidation {
  isValid: boolean
  type: 'GSM' | 'Unicode'
  invalidChars?: string[]
  length: number
  smsCount: number
  estimatedCost: number
}

// Types pour les erreurs
export interface SmsError {
  code: string
  message: string
  details?: string
}

// Limites selon la documentation MTN
export interface SMSLimits {
  maxMessageLength: 1071 // 7 SMS maximum
  maxSenderLength: 11 // Nom expéditeur
  maxRecipients: 1000 // Numéros max par envoi
  smsCharacterLimits: {
    single: 160 // 1 SMS
    multiple: 153 // SMS multiples (153 chars chacun après le premier)
  }
  supportedFormats: ['GSM', 'Unicode']
  costPerSms: 25 // Coût standard par SMS
}
