/**
 * Types pour la gestion des collections Appwrite
 */

export interface BaseAttribute {
  type: 'string' | 'integer' | 'double' | 'boolean' | 'email' | 'enum' | 'url' | 'datetime' | 'ip'
  required?: boolean
  array?: boolean
  size?: number
  min?: number
  max?: number
  default?: any
  elements?: string[]
}

export interface IndexConfig {
  key: string
  type: 'unique' | 'key' | 'fulltext'
  attributes: string[]
  orders?: string[]
}

export interface CollectionPermissions {
  create: string[]
  read: string[]
  update: string[]
  delete: string[]
}

export type CollectionAction =
  | 'create'
  | 'update'
  | 'recreate'
  | 'update-rows'
  | 'delete'
  | 'skip'

export interface CollectionActionConfig {
  action: CollectionAction
  collection: string
}

export interface CollectionDefinition {
  id: string
  name: string
  attributes?: Record<string, BaseAttribute>
  indexes?: IndexConfig[]
  permissions?: CollectionPermissions
}

export interface DatabaseInitResult {
  success: boolean
  collections: {
    created: string[]
    updated: string[]
    skipped: string[]
    errors: string[]
  }
  duration: number
  timestamp: string
}
