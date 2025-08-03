import { AppwriteService } from '#services/appwrite_service'
import { ATTRIBUTES, INDEXES, PERMISSIONS, COLLECTIONS } from '#config/collections'
import type {
  CollectionAction,
  CollectionActionConfig,
  BaseAttribute,
  DatabaseInitResult,
} from '#types/database_types'

/**
 * Service de gestion des collections Appwrite
 * Permet de créer, mettre à jour et gérer les collections automatiquement
 */
export class CollectionManagerService {
  constructor(private appwrite: AppwriteService) {}

  /**
   * Initialise toutes les collections définies dans la configuration
   */
  async initializeAllCollections(): Promise<DatabaseInitResult> {
    const startTime = Date.now()
    const result: DatabaseInitResult = {
      success: true,
      collections: {
        created: [],
        updated: [],
        skipped: [],
        errors: [],
      },
      duration: 0,
      timestamp: new Date().toISOString(),
    }

    try {
      // Vérifier que la base de données existe
      await this.ensureDatabaseExists()

      // Créer toutes les collections
      for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
        try {
          const action = await this.processCollectionAction({
            action: 'create',
            collection: collectionName,
          })

          if (action.created) {
            result.collections.created.push(collectionName)
          } else {
            result.collections.skipped.push(collectionName)
          }
        } catch (error) {
          console.error(`Erreur avec collection ${collectionName}:`, error)
          result.collections.errors.push(`${collectionName}: ${error.message}`)
          result.success = false
        }
      }

      result.duration = Date.now() - startTime
      return result
    } catch (error) {
      result.success = false
      result.collections.errors.push(`Erreur générale: ${error.message}`)
      result.duration = Date.now() - startTime
      return result
    }
  }

  /**
   * Exécute des actions spécifiques sur des collections
   */
  async executeCollectionActions(actions: CollectionActionConfig[]): Promise<DatabaseInitResult> {
    const startTime = Date.now()
    const result: DatabaseInitResult = {
      success: true,
      collections: {
        created: [],
        updated: [],
        skipped: [],
        errors: [],
      },
      duration: 0,
      timestamp: new Date().toISOString(),
    }

    try {
      await this.ensureDatabaseExists()

      for (const actionConfig of actions) {
        try {
          const actionResult = await this.processCollectionAction(actionConfig)

          if (actionResult.created) {
            result.collections.created.push(actionConfig.collection)
          } else if (actionResult.updated) {
            result.collections.updated.push(actionConfig.collection)
          } else {
            result.collections.skipped.push(actionConfig.collection)
          }
        } catch (error) {
          console.error(`Erreur avec collection ${actionConfig.collection}:`, error)
          result.collections.errors.push(`${actionConfig.collection}: ${error.message}`)
          result.success = false
        }
      }

      result.duration = Date.now() - startTime
      return result
    } catch (error) {
      result.success = false
      result.collections.errors.push(`Erreur générale: ${error.message}`)
      result.duration = Date.now() - startTime
      return result
    }
  }

  /**
   * Traite une action sur une collection spécifique
   */
  private async processCollectionAction(actionConfig: CollectionActionConfig): Promise<{
    created: boolean
    updated: boolean
    deleted: boolean
  }> {
    const { action, collection } = actionConfig
    const collectionId = COLLECTIONS[collection as keyof typeof COLLECTIONS]

    if (!collectionId) {
      throw new Error(`Collection ${collection} non trouvée dans la configuration`)
    }

    console.log(`🔄 Action "${action}" sur collection ${collection} (${collectionId})`)

    switch (action) {
      case 'create':
        return await this.createCollection(collectionId, collection)

      case 'update':
        return await this.updateCollection(collectionId, collection)

      case 'recreate':
        await this.deleteCollection(collectionId, collection)
        return await this.createCollection(collectionId, collection)

      case 'update-rows':
        return await this.updateCollectionStructure(collectionId, collection)

      case 'delete':
        return await this.deleteCollection(collectionId, collection)

      case 'skip':
        console.log(`⏭️ Collection ${collection} ignorée`)
        return { created: false, updated: false, deleted: false }

      default:
        throw new Error(`Action inconnue: ${action}`)
    }
  }

  /**
   * Crée une collection avec ses attributs et index
   */
  private async createCollection(
    collectionId: string,
    collectionName: string
  ): Promise<{
    created: boolean
    updated: boolean
    deleted: boolean
  }> {
    try {
      // Vérifier si la collection existe déjà
      await this.appwrite.databases.getCollection(process.env.APPWRITE_DATABASE_ID!, collectionId)
      console.log(`ℹ️ Collection ${collectionName} existe déjà`)
      return { created: false, updated: false, deleted: false }
    } catch (error: any) {
      if (error.code !== 404) {
        throw error
      }
    }

    console.log(`📝 Création de la collection ${collectionName}...`)

    // Récupérer les permissions
    const permissions = PERMISSIONS[collectionName]
    const collectionPermissions = permissions
      ? [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
      : []

    // Créer la collection
    await this.appwrite.databases.createCollection(
      process.env.APPWRITE_DATABASE_ID!,
      collectionId,
      collectionName,
      collectionPermissions
    )
    console.log(`✅ Collection ${collectionName} créée`)

    // Ajouter les attributs et index
    await this.addAttributesAndIndexes(collectionId, collectionName)

    return { created: true, updated: false, deleted: false }
  }

  /**
   * Met à jour les permissions d'une collection
   */
  private async updateCollection(
    collectionId: string,
    collectionName: string
  ): Promise<{
    created: boolean
    updated: boolean
    deleted: boolean
  }> {
    console.log(`🔄 Mise à jour de la collection ${collectionName}...`)

    const permissions = PERMISSIONS[collectionName]
    if (permissions) {
      await this.appwrite.databases.updateCollection(
        process.env.APPWRITE_DATABASE_ID!,
        collectionId,
        collectionName,
        [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
      )
      console.log(`✅ Permissions de ${collectionName} mises à jour`)
    }

    return { created: false, updated: true, deleted: false }
  }

  /**
   * Supprime une collection
   */
  private async deleteCollection(
    collectionId: string,
    collectionName: string
  ): Promise<{
    created: boolean
    updated: boolean
    deleted: boolean
  }> {
    try {
      console.log(`🗑️ Suppression de la collection ${collectionName}...`)
      await this.appwrite.databases.deleteCollection(
        process.env.APPWRITE_DATABASE_ID!,
        collectionId
      )
      console.log(`✅ Collection ${collectionName} supprimée`)
      return { created: false, updated: false, deleted: true }
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`ℹ️ Collection ${collectionName} n'existe pas`)
        return { created: false, updated: false, deleted: false }
      }
      throw error
    }
  }

  /**
   * Met à jour la structure d'une collection (attributs et index)
   */
  private async updateCollectionStructure(
    collectionId: string,
    collectionName: string
  ): Promise<{
    created: boolean
    updated: boolean
    deleted: boolean
  }> {
    console.log(`🔧 Mise à jour de la structure de ${collectionName}...`)

    // Vérifier que la collection existe
    try {
      await this.appwrite.databases.getCollection(process.env.APPWRITE_DATABASE_ID!, collectionId)
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`⚠️ Collection ${collectionName} n'existe pas, création...`)
        return await this.createCollection(collectionId, collectionName)
      }
      throw error
    }

    // Ajouter les nouveaux attributs et index
    await this.addAttributesAndIndexes(collectionId, collectionName)

    return { created: false, updated: true, deleted: false }
  }

  /**
   * Ajoute les attributs et index à une collection
   */
  private async addAttributesAndIndexes(
    collectionId: string,
    collectionName: string
  ): Promise<void> {
    const databaseId = process.env.APPWRITE_DATABASE_ID!

    // Création des attributs
    const attributes = ATTRIBUTES[collectionName]
    if (attributes) {
      console.log(`📋 Ajout des attributs pour ${collectionName}...`)

      for (const [attrName, attrConfig] of Object.entries(attributes)) {
        try {
          await this.createAttribute(databaseId, collectionId, attrName, attrConfig)
          console.log(`  ✅ Attribut ${attrName} créé`)
        } catch (error: any) {
          if (error.code === 409) {
            console.log(`  ℹ️ Attribut ${attrName} existe déjà`)
          } else {
            console.error(`  ❌ Erreur avec attribut ${attrName}:`, error.message)
            throw error
          }
        }
      }
    }

    // Création des index
    const indexes = INDEXES[collectionName]
    if (indexes) {
      console.log(`🔍 Ajout des index pour ${collectionName}...`)

      for (const indexConfig of indexes) {
        try {
          await this.appwrite.databases.createIndex(
            databaseId,
            collectionId,
            indexConfig.key,
            indexConfig.type,
            indexConfig.attributes
          )
          console.log(`  ✅ Index ${indexConfig.key} créé`)
        } catch (error: any) {
          if (error.code === 409) {
            console.log(`  ℹ️ Index ${indexConfig.key} existe déjà`)
          } else {
            console.error(`  ❌ Erreur avec index ${indexConfig.key}:`, error.message)
            throw error
          }
        }
      }
    }
  }

  /**
   * Crée un attribut selon son type
   */
  private async createAttribute(
    databaseId: string,
    collectionId: string,
    attrName: string,
    attrConfig: BaseAttribute
  ): Promise<void> {
    const {
      type,
      required = false,
      array = false,
      size,
      elements,
      default: defaultValue,
      min,
      max,
    } = attrConfig

    switch (type) {
      case 'string':
        await this.appwrite.createStringAttribute(
          databaseId,
          collectionId,
          attrName,
          size!,
          required,
          defaultValue
        )
        break

      case 'integer':
        await this.appwrite.createIntegerAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          min,
          max,
          defaultValue
        )
        break

      case 'double':
        await this.appwrite.createFloatAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          min,
          max,
          defaultValue
        )
        break

      case 'boolean':
        await this.appwrite.createBooleanAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          defaultValue
        )
        break

      case 'email':
        await this.appwrite.databases.createEmailAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          defaultValue,
          array
        )
        break

      case 'enum':
        await this.appwrite.databases.createEnumAttribute(
          databaseId,
          collectionId,
          attrName,
          elements!,
          required,
          defaultValue,
          array
        )
        break

      case 'url':
        await this.appwrite.databases.createUrlAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          defaultValue,
          array
        )
        break

      case 'datetime':
        await this.appwrite.createDatetimeAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          defaultValue
        )
        break

      case 'ip':
        await this.appwrite.databases.createIpAttribute(
          databaseId,
          collectionId,
          attrName,
          required,
          defaultValue,
          array
        )
        break

      default:
        throw new Error(`Type d'attribut non supporté: ${type}`)
    }
  }

  /**
   * S'assure que la base de données existe
   */
  private async ensureDatabaseExists(): Promise<void> {
    const databaseId = process.env.APPWRITE_DATABASE_ID!

    try {
      await this.appwrite.databases.get(databaseId)
      console.log('✅ Base de données trouvée')
    } catch (error: any) {
      if (error.code === 404) {
        console.log('⚠️ Base de données non trouvée, création...')
        await this.appwrite.databases.create(databaseId, 'Fournisseur CG Database', true)
        console.log('✅ Base de données créée')
      } else {
        throw error
      }
    }
  }
}
