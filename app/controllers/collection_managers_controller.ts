import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { CollectionManagerService } from '#services/collection_manager_service'
import { AppwriteService } from '#services/appwrite_service'
import type { CollectionActionConfig } from '#types/database_types'

@inject()
export default class CollectionManagersController {
  constructor(
    private appwrite: AppwriteService,
    private collectionManager: CollectionManagerService
  ) {}

  /**
   * @initializeAllCollections
   * @summary Initialiser toutes les collections Appwrite
   * @description Crée toutes les collections définies dans la configuration avec leurs attributs et index
   * @tag Appwrite Integration
   * @responseBody 200 - {"success": true, "collections": {"created": ["QUOTES", "CONTACTS"], "updated": [], "skipped": [], "errors": []}, "duration": 1500, "timestamp": "2024-01-01T00:00:00.000Z"}
   * @responseBody 500 - {"success": false, "error": "Erreur lors de l'initialisation", "details": "string"}
   */
  async initializeAllCollections({ response }: HttpContext) {
    try {
      console.log('🚀 Initialisation de toutes les collections Appwrite...')

      const result = await this.collectionManager.initializeAllCollections()

      if (result.success) {
        return response.ok({
          message: 'Initialisation des collections terminée avec succès',
          ...result,
        })
      } else {
        return response.status(500).json({
          message: "Erreurs lors de l'initialisation des collections",
          ...result,
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des collections:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'initialisation des collections",
        details: error.message,
      })
    }
  }

  /**
   * @executeCollectionActions
   * @summary Exécuter des actions sur des collections spécifiques
   * @description Permet d'exécuter des actions ciblées (create, update, recreate, delete) sur des collections
   * @tag Appwrite Integration
   * @requestBody [{"action": "create", "collection": "QUOTES"}, {"action": "update", "collection": "CONTACTS"}]
   * @responseBody 200 - {"success": true, "collections": {"created": ["QUOTES"], "updated": ["CONTACTS"], "skipped": [], "errors": []}}
   * @responseBody 400 - {"error": "Actions requises", "details": "Le body doit contenir un tableau d'actions"}
   * @responseBody 500 - {"success": false, "error": "Erreur lors de l'exécution", "details": "string"}
   */
  async executeCollectionActions({ request, response }: HttpContext) {
    try {
      const actions = request.input('actions') as CollectionActionConfig[]

      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        return response.badRequest({
          error: 'Actions requises',
          details:
            'Le body doit contenir un tableau d\'actions avec les propriétés "action" et "collection"',
          example: [
            { action: 'create', collection: 'QUOTES' },
            { action: 'update', collection: 'CONTACTS' },
          ],
        })
      }

      // Validation des actions
      const validActions = ['create', 'update', 'recreate', 'update-rows', 'delete', 'skip']
      for (const actionConfig of actions) {
        if (!actionConfig.action || !actionConfig.collection) {
          return response.badRequest({
            error: 'Action invalide',
            details: 'Chaque action doit avoir les propriétés "action" et "collection"',
          })
        }

        if (!validActions.includes(actionConfig.action)) {
          return response.badRequest({
            error: "Type d'action invalide",
            details: `Actions valides: ${validActions.join(', ')}`,
          })
        }
      }

      console.log(`🔧 Exécution de ${actions.length} actions sur les collections...`)

      const result = await this.collectionManager.executeCollectionActions(actions)

      if (result.success) {
        return response.ok({
          message: 'Actions exécutées avec succès',
          ...result,
        })
      } else {
        return response.status(500).json({
          message: "Erreurs lors de l'exécution des actions",
          ...result,
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution des actions:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'exécution des actions",
        details: error.message,
      })
    }
  }

  /**
   * @getCollectionStatus
   * @summary Obtenir le statut des collections
   * @description Récupère l'état actuel de toutes les collections configurées
   * @tag Appwrite Integration
   * @responseBody 200 - {"collections": {"QUOTES": {"exists": true, "attributes": 15, "indexes": 4}, "CONTACTS": {"exists": false}}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération du statut", "details": "string"}
   */
  async getCollectionStatus({ response }: HttpContext) {
    try {
      const { COLLECTIONS } = await import('#config/collections')
      const status: Record<string, any> = {}

      for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
        try {
          const collection = await this.appwrite.databases.getCollection(
            process.env.APPWRITE_DATABASE_ID!,
            collectionId
          )

          status[collectionName] = {
            exists: true,
            id: collection.$id,
            name: collection.name,
            attributes: collection.attributes?.length || 0,
            indexes: collection.indexes?.length || 0,
            enabled: collection.enabled,
            documentSecurity: collection.documentSecurity,
            createdAt: collection.$createdAt,
            updatedAt: collection.$updatedAt,
          }
        } catch (error: any) {
          if (error.code === 404) {
            status[collectionName] = {
              exists: false,
              id: collectionId,
            }
          } else {
            status[collectionName] = {
              exists: false,
              error: error.message,
            }
          }
        }
      }

      return response.ok({
        success: true,
        collections: status,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      return response.internalServerError({
        error: 'Erreur lors de la récupération du statut des collections',
        details: error.message,
      })
    }
  }

  /**
   * @getCollectionConfiguration
   * @summary Obtenir la configuration des collections
   * @description Récupère la configuration complète des collections (attributs, index, permissions)
   * @tag Appwrite Integration
   * @responseBody 200 - {"collections": ["QUOTES", "CONTACTS"], "attributes": {...}, "indexes": {...}, "permissions": {...}}
   */
  async getCollectionConfiguration({ response }: HttpContext) {
    try {
      const { COLLECTIONS, ATTRIBUTES, INDEXES, PERMISSIONS } = await import('#config/collections')

      return response.ok({
        success: true,
        configuration: {
          collections: COLLECTIONS,
          attributes: ATTRIBUTES,
          indexes: INDEXES,
          permissions: Object.keys(PERMISSIONS),
        },
        totalCollections: Object.keys(COLLECTIONS).length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error)
      return response.internalServerError({
        error: 'Erreur lors de la récupération de la configuration',
        details: error.message,
      })
    }
  }
}
