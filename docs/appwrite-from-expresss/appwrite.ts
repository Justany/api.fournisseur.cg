// import { Models } from 'node-appwrite'

// // Configuration Appwrite
// export interface AppwriteConfig {
//   endpoint: string
//   projectId: string
//   apiKey: string
//   databaseId: string
// }

// // Types de base pour les documents Appwrite
// export interface AppwriteDocument extends Models.Document {
//   $id: string
//   $createdAt: string
//   $updatedAt: string
//   $permissions: string[]
//   $collectionId: string
//   $databaseId: string
// }

// // Types pour les collections
// export interface QuoteDocument extends AppwriteDocument {
//   quote_id: string
//   user_id?: string
//   first_name: string
//   last_name: string
//   email: string
//   phone: string
//   company?: string
//   service_type: string
//   project_description: string
//   estimated_budget: string
//   desired_timeline: string
//   status: 'pending' | 'approved' | 'rejected' | 'cancelled'
//   // Autres champs spécifiques aux devis
// }

// export interface ContactDocument extends AppwriteDocument {
//   first_name: string
//   last_name: string
//   email: string
//   phone: string
//   subject: string
//   message: string
//   status: 'new' | 'read' | 'replied'
//   // Autres champs spécifiques aux contacts
// }

// export interface ProductDocument extends AppwriteDocument {
//   product_id: string
//   title: string
//   description?: string
//   price: number
//   image_url?: string
//   // Autres champs spécifiques aux produits
// }

// // Types pour les requêtes
// export interface AppwriteQuery {
//   equal?: [string, any]
//   notEqual?: [string, any]
//   lessThan?: [string, any]
//   lessThanEqual?: [string, any]
//   greaterThan?: [string, any]
//   greaterThanEqual?: [string, any]
//   search?: [string, string]
//   orderDesc?: string
//   orderAsc?: string
//   limit?: number
//   offset?: number
//   cursorAfter?: string
//   cursorBefore?: string
// }

// // Types pour les réponses
// export interface AppwriteListResponse<T extends AppwriteDocument> {
//   documents: T[]
//   total: number
// }

// // Types pour les erreurs
// export interface AppwriteError {
//   code: number
//   message: string
//   type: string
// }
