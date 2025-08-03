import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AppwriteService } from '#services/appwrite_service'

@inject()
export default class AppwritesController {
  constructor(private appwrite: AppwriteService) {}

  /**
   * @health
   * @summary Appwrite connection health check
   * @description Check Appwrite server connection status
   * @tag Appwrite
   * @responseBody 200 - {"status": "healthy", "databases": 2, "timestamp": "2024-01-01T00:00:00.000Z"}
   * @responseBody 500 - {"error": "Erreur lors du health check Appwrite", "details": "Connection failed"}
   */
  async health({ response }: HttpContext) {
    try {
      const health = await this.appwrite.healthCheck()
      return response.ok(health)
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors du health check Appwrite',
        details: error.message,
      })
    }
  }

  /**
   * @listDatabases
   * @summary List all Appwrite databases
   * @description Get all available databases
   * @tag Appwrite
   * @responseBody 200 - {"success": true, "data": {"total": 2, "databases": []}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération des bases de données", "details": "string"}
   */
  async listDatabases({ response }: HttpContext) {
    try {
      const databases = await this.appwrite.databases.list()
      return response.ok({
        success: true,
        data: databases,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la récupération des bases de données',
        details: error.message,
      })
    }
  }

  /**
   * @listCollections
   * @summary List database collections
   * @description Get all collections from a specific database
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @responseBody 200 - {"success": true, "data": {"total": 5, "collections": []}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération des collections", "details": "string"}
   */
  async listCollections({ params, response }: HttpContext) {
    try {
      console.log('🔍 [DEBUG] listCollections appelé avec databaseId:', params.databaseId)
      const { databaseId } = params
      const collections = await this.appwrite.databases.listCollections(databaseId)
      console.log('🔍 [DEBUG] collections récupérées:', collections)

      const result = {
        success: true,
        data: collections,
      }
      console.log('🔍 [DEBUG] Envoi de la réponse:', result)
      return response.ok(result)
    } catch (error) {
      console.error('❌ [ERROR] listCollections:', error.message)
      return response.internalServerError({
        error: 'Erreur lors de la récupération des collections',
        details: error.message,
      })
    }
  }

  /**
   * @createCollection
   * @summary Create new collection
   * @description Create a new collection in Appwrite database
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @requestBody {"collectionId": "orders", "name": "Commandes", "permissions": [], "documentSecurity": false}
   * @responseBody 201 - {"success": true, "data": {"$id": "orders", "name": "Commandes"}}
   * @responseBody 500 - {"error": "Erreur lors de la création de la collection", "details": "string"}
   */
  async createCollection({ params, request, response }: HttpContext) {
    try {
      const { databaseId } = params
      const { collectionId, name, permissions, documentSecurity } = request.only([
        'collectionId',
        'name',
        'permissions',
        'documentSecurity',
      ])

      const collection = await this.appwrite.createCollection(
        databaseId,
        collectionId,
        name,
        permissions || [],
        documentSecurity || false
      )

      return response.created({
        success: true,
        data: collection,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la création de la collection',
        details: error.message,
      })
    }
  }

  /**
   * @listDocuments
   * @summary List collection documents
   * @description Get all documents from a collection with optional filters
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @paramQuery queries - Requêtes de filtrage - @type(array) @default([])
   * @responseBody 200 - {"success": true, "data": {"total": 10, "documents": []}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération des documents", "details": "string"}
   */
  async listDocuments({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const queries = request.input('queries', [])

      const documents = await this.appwrite.listDocuments(databaseId, collectionId, queries)

      return response.ok({
        success: true,
        data: documents,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la récupération des documents',
        details: error.message,
      })
    }
  }

  /**
   * @createDocument
   * @summary Create new document
   * @description Create a new document in Appwrite collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @requestBody {"documentId": "unique()", "data": {"title": "Test", "status": "active"}, "permissions": []}
   * @responseBody 201 - {"success": true, "data": {"$id": "document123", "title": "Test"}}
   * @responseBody 500 - {"error": "Erreur lors de la création du document", "details": "string"}
   */
  async createDocument({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const { documentId, data, permissions } = request.only(['documentId', 'data', 'permissions'])

      const document = await this.appwrite.createDocument(
        databaseId,
        collectionId,
        documentId,
        data,
        permissions || []
      )

      return response.created({
        success: true,
        data: document,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la création du document',
        details: error.message,
      })
    }
  }

  /**
   * @getDocument
   * @summary Get specific document
   * @description Get document by ID with optional queries
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @paramPath documentId - ID du document - @type(string) @required
   * @paramQuery queries - Requêtes de filtrage - @type(array) @default([])
   * @responseBody 200 - {"success": true, "data": {"$id": "document123", "title": "Test"}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération du document", "details": "string"}
   */
  async getDocument({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId, documentId } = params
      const queries = request.input('queries', [])

      const document = await this.appwrite.getDocument(
        databaseId,
        collectionId,
        documentId,
        queries
      )

      return response.ok({
        success: true,
        data: document,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la récupération du document',
        details: error.message,
      })
    }
  }

  /**
   * @updateDocument
   * @summary Update document
   * @description Update existing document data
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @paramPath documentId - ID du document - @type(string) @required
   * @requestBody {"data": {"title": "Nouveau titre", "status": "updated"}, "permissions": []}
   * @responseBody 200 - {"success": true, "data": {"$id": "document123", "title": "Nouveau titre"}}
   * @responseBody 500 - {"error": "Erreur lors de la mise à jour du document", "details": "string"}
   */
  async updateDocument({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId, documentId } = params
      const { data, permissions } = request.only(['data', 'permissions'])

      const document = await this.appwrite.updateDocument(
        databaseId,
        collectionId,
        documentId,
        data,
        permissions
      )

      return response.ok({
        success: true,
        data: document,
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la mise à jour du document',
        details: error.message,
      })
    }
  }

  /**
   * @deleteDocument
   * @summary Delete document
   * @description Permanently delete document from collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @paramPath documentId - ID du document - @type(string) @required
   * @responseBody 200 - {"success": true, "message": "Document supprimé avec succès"}
   * @responseBody 500 - {"error": "Erreur lors de la suppression du document", "details": "string"}
   */
  async deleteDocument({ params, response }: HttpContext) {
    try {
      const { databaseId, collectionId, documentId } = params

      await this.appwrite.deleteDocument(databaseId, collectionId, documentId)

      return response.ok({
        success: true,
        message: 'Document supprimé avec succès',
      })
    } catch (error) {
      return response.internalServerError({
        error: 'Erreur lors de la suppression du document',
        details: error.message,
      })
    }
  }

  /**
   * @createStringAttribute
   * @summary Create string attribute
   * @description Create new string attribute for collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @requestBody {"key": "title", "size": 255, "required": true, "defaultValue": ""}
   * @responseBody 201 - {"success": true, "data": {"key": "title", "type": "string", "size": 255}}
   * @responseBody 500 - {"error": "Erreur lors de la création de l'attribut string", "details": "string"}
   */
  async createStringAttribute({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const { key, size, required, defaultValue } = request.only([
        'key',
        'size',
        'required',
        'defaultValue',
      ])

      const attribute = await this.appwrite.createStringAttribute(
        databaseId,
        collectionId,
        key,
        size,
        required || false,
        defaultValue
      )

      return response.created({
        success: true,
        data: attribute,
      })
    } catch (error) {
      return response.internalServerError({
        error: "Erreur lors de la création de l'attribut string",
        details: error.message,
      })
    }
  }

  /**
   * @createIntegerAttribute
   * @summary Create integer attribute
   * @description Create new integer attribute for collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @requestBody {"key": "price", "required": false, "min": 0, "max": 999999, "defaultValue": 0}
   * @responseBody 201 - {"success": true, "data": {"key": "price", "type": "integer", "min": 0, "max": 999999}}
   * @responseBody 500 - {"error": "Erreur lors de la création de l'attribut integer", "details": "string"}
   */
  async createIntegerAttribute({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const { key, required, min, max, defaultValue } = request.only([
        'key',
        'required',
        'min',
        'max',
        'defaultValue',
      ])

      const attribute = await this.appwrite.createIntegerAttribute(
        databaseId,
        collectionId,
        key,
        required || false,
        min,
        max,
        defaultValue
      )

      return response.created({
        success: true,
        data: attribute,
      })
    } catch (error) {
      return response.internalServerError({
        error: "Erreur lors de la création de l'attribut integer",
        details: error.message,
      })
    }
  }

  /**
   * @createBooleanAttribute
   * @summary Create boolean attribute
   * @description Create new boolean attribute for collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @requestBody {"key": "isActive", "required": false, "defaultValue": true}
   * @responseBody 201 - {"success": true, "data": {"key": "isActive", "type": "boolean", "default": true}}
   * @responseBody 500 - {"error": "Erreur lors de la création de l'attribut boolean", "details": "string"}
   */
  async createBooleanAttribute({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const { key, required, defaultValue } = request.only(['key', 'required', 'defaultValue'])

      const attribute = await this.appwrite.createBooleanAttribute(
        databaseId,
        collectionId,
        key,
        required || false,
        defaultValue
      )

      return response.created({
        success: true,
        data: attribute,
      })
    } catch (error) {
      return response.internalServerError({
        error: "Erreur lors de la création de l'attribut boolean",
        details: error.message,
      })
    }
  }

  /**
   * @createDatetimeAttribute
   * @summary Create datetime attribute
   * @description Create new datetime attribute for collection
   * @tag Appwrite
   * @paramPath databaseId - ID de la base de données - @type(string) @required
   * @paramPath collectionId - ID de la collection - @type(string) @required
   * @requestBody {"key": "createdAt", "required": true, "defaultValue": "2024-01-01T00:00:00.000Z"}
   * @responseBody 201 - {"success": true, "data": {"key": "createdAt", "type": "datetime", "format": "datetime"}}
   * @responseBody 500 - {"error": "Erreur lors de la création de l'attribut datetime", "details": "string"}
   */
  async createDatetimeAttribute({ params, request, response }: HttpContext) {
    try {
      const { databaseId, collectionId } = params
      const { key, required, defaultValue } = request.only(['key', 'required', 'defaultValue'])

      const attribute = await this.appwrite.createDatetimeAttribute(
        databaseId,
        collectionId,
        key,
        required || false,
        defaultValue
      )

      return response.created({
        success: true,
        data: attribute,
      })
    } catch (error) {
      return response.internalServerError({
        error: "Erreur lors de la création de l'attribut datetime",
        details: error.message,
      })
    }
  }
}
