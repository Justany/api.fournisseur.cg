/**
 * Types pour l'intégration Appwrite
 */

export interface AppwriteHealthCheck {
  status: 'healthy' | 'unhealthy'
  databases?: number
  error?: string
  timestamp: string
}

export interface AppwriteResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: string
}

export interface CreateCollectionRequest {
  collectionId: string
  name: string
  permissions?: string[]
  documentSecurity?: boolean
}

export interface CreateDocumentRequest {
  documentId: string
  data: Record<string, any>
  permissions?: string[]
}

export interface UpdateDocumentRequest {
  data: Record<string, any>
  permissions?: string[]
}

export interface CreateStringAttributeRequest {
  key: string
  size: number
  required?: boolean
  defaultValue?: string
}

export interface CreateIntegerAttributeRequest {
  key: string
  required?: boolean
  min?: number
  max?: number
  defaultValue?: number
}

export interface CreateBooleanAttributeRequest {
  key: string
  required?: boolean
  defaultValue?: boolean
}

export interface CreateDatetimeAttributeRequest {
  key: string
  required?: boolean
  defaultValue?: string
}

export interface AppwriteDatabase {
  $id: string
  name: string
  enabled: boolean
  $createdAt: string
  $updatedAt: string
}

export interface AppwriteCollection {
  $id: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  databaseId: string
  name: string
  enabled: boolean
  documentSecurity: boolean
  attributes: AppwriteAttribute[]
  indexes: AppwriteIndex[]
}

export interface AppwriteDocument {
  $id: string
  $collectionId: string
  $databaseId: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  [key: string]: any
}

export interface AppwriteAttribute {
  key: string
  type: 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'email' | 'ip' | 'url'
  status: 'available' | 'processing' | 'deleting' | 'stuck' | 'failed'
  error?: string
  required: boolean
  array?: boolean
  size?: number
  min?: number
  max?: number
  default?: any
  format?: string
  elements?: string[]
}

export interface AppwriteIndex {
  key: string
  type: 'key' | 'fulltext' | 'unique'
  status: 'available' | 'processing' | 'deleting' | 'stuck' | 'failed'
  error?: string
  attributes: string[]
  orders?: string[]
}

export interface AppwriteListResponse<T> {
  total: number
  documents?: T[]
  databases?: T[]
  collections?: T[]
  users?: T[]
}

export interface AppwriteUser {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  registration: string
  status: boolean
  labels: string[]
  passwordUpdate: string
  email: string
  phone: string
  emailVerification: boolean
  phoneVerification: boolean
  mfa: boolean
  prefs: Record<string, any>
  targets: any[]
  accessedAt: string
}