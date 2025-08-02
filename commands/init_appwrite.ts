import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { AppwriteService } from '#services/appwrite_service'
import { CollectionManagerService } from '#services/collection_manager_service'
import type { CollectionActionConfig } from '#types/database_types'

export default class InitAppwrite extends BaseCommand {
  static commandName = 'appwrite:init'
  static description = 'Initialise les collections Appwrite pour Fournisseur CG'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({
    description: 'Action à effectuer (all, create, update, recreate, delete, status)',
    required: false,
  })
  declare action: string

  @args.string({
    description: 'Nom de la collection spécifique (optionnel)',
    required: false,
  })
  declare collection: string

  @flags.boolean({
    description: 'Forcer la recréation des collections existantes',
    alias: 'f',
  })
  declare force: boolean

  @flags.boolean({
    description: 'Mode silencieux (moins de logs)',
    alias: 's',
  })
  declare silent: boolean

  async run() {
    const action = this.action || 'all'

    if (!this.silent) {
      this.logger.info("🚀 Initialisation d'Appwrite pour Fournisseur CG")
    }

    try {
      // Initialiser les services
      const appwrite = new AppwriteService()
      const collectionManager = new CollectionManagerService(appwrite)

      // Vérifier la connexion
      const health = await appwrite.healthCheck()
      if (health.status === 'unhealthy') {
        this.logger.error('❌ Connexion à Appwrite échouée')
        this.logger.error(health.error || 'Erreur inconnue')
        return
      }

      if (!this.silent) {
        this.logger.success('✅ Connexion à Appwrite établie')
      }

      switch (action.toLowerCase()) {
        case 'all':
          await this.initializeAllCollections(collectionManager)
          break

        case 'create':
          await this.handleSingleCollection(collectionManager, 'create')
          break

        case 'update':
          await this.handleSingleCollection(collectionManager, 'update')
          break

        case 'recreate':
          await this.handleSingleCollection(collectionManager, 'recreate')
          break

        case 'delete':
          await this.handleSingleCollection(collectionManager, 'delete')
          break

        case 'status':
          await this.showCollectionStatus(appwrite)
          break

        default:
          this.logger.error(`❌ Action inconnue: ${action}`)
          this.logger.info('Actions disponibles: all, create, update, recreate, delete, status')
          return
      }
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation d'Appwrite")
      this.logger.error(error.message)
      process.exit(1)
    }
  }

  private async initializeAllCollections(collectionManager: CollectionManagerService) {
    if (!this.silent) {
      this.logger.info('📋 Initialisation de toutes les collections...')
    }

    const result = await collectionManager.initializeAllCollections()

    // Affichage des résultats
    if (result.collections.created.length > 0) {
      this.logger.success(`✅ Collections créées: ${result.collections.created.join(', ')}`)
    }

    if (result.collections.updated.length > 0) {
      this.logger.success(`🔄 Collections mises à jour: ${result.collections.updated.join(', ')}`)
    }

    if (result.collections.skipped.length > 0) {
      this.logger.info(`⏭️ Collections ignorées: ${result.collections.skipped.join(', ')}`)
    }

    if (result.collections.errors.length > 0) {
      this.logger.error(`❌ Erreurs: ${result.collections.errors.join(', ')}`)
    }

    const duration = Math.round((result.duration / 1000) * 100) / 100
    this.logger.info(`⏱️ Durée: ${duration}s`)

    if (result.success) {
      this.logger.success('🎉 Initialisation terminée avec succès!')
    } else {
      this.logger.error('⚠️ Initialisation terminée avec des erreurs')
    }
  }

  private async handleSingleCollection(
    collectionManager: CollectionManagerService,
    action: string
  ) {
    if (!this.collection) {
      this.logger.error('❌ Nom de collection requis pour cette action')
      this.logger.info('Usage: node ace appwrite:init create QUOTES')
      return
    }

    const actionConfig: CollectionActionConfig = {
      action: action as any,
      collection: this.collection.toUpperCase(),
    }

    if (!this.silent) {
      this.logger.info(`🔧 ${action} de la collection ${this.collection}...`)
    }

    const result = await collectionManager.executeCollectionActions([actionConfig])

    // Affichage des résultats
    if (result.collections.created.length > 0) {
      this.logger.success(`✅ Collection créée: ${result.collections.created[0]}`)
    }

    if (result.collections.updated.length > 0) {
      this.logger.success(`🔄 Collection mise à jour: ${result.collections.updated[0]}`)
    }

    if (result.collections.errors.length > 0) {
      this.logger.error(`❌ Erreur: ${result.collections.errors[0]}`)
    }

    if (result.success) {
      this.logger.success('✅ Action terminée avec succès!')
    }
  }

  private async showCollectionStatus(appwrite: AppwriteService) {
    if (!this.silent) {
      this.logger.info('📊 État des collections Appwrite...')
    }

    try {
      const { COLLECTIONS } = await import('#config/collections')

      this.logger.info('\n📋 Collections configurées:')

      for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
        try {
          const collection = await appwrite.databases.getCollection(
            process.env.APPWRITE_DATABASE_ID!,
            collectionId
          )

          this.logger.success(`✅ ${collectionName} (${collectionId})`)
          this.logger.info(`   - Attributs: ${collection.attributes?.length || 0}`)
          this.logger.info(`   - Index: ${collection.indexes?.length || 0}`)
          this.logger.info(`   - Activée: ${collection.enabled ? 'Oui' : 'Non'}`)
        } catch (error: any) {
          if (error.code === 404) {
            this.logger.error(`❌ ${collectionName} (${collectionId}) - N'existe pas`)
          } else {
            this.logger.error(`⚠️ ${collectionName} (${collectionId}) - Erreur: ${error.message}`)
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération du statut')
      this.logger.error(error.message)
    }
  }
}
