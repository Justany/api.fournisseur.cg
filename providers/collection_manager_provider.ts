import type { ApplicationService } from '@adonisjs/core/types'
import { CollectionManagerService } from '#services/collection_manager_service'
import { AppwriteService } from '#services/appwrite_service'

export default class CollectionManagerProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(CollectionManagerService, async () => {
      const appwrite = await this.app.container.make(AppwriteService)
      return new CollectionManagerService(appwrite)
    })
  }

  async boot() {
    // Optionnel: vérification de la connexion au démarrage
    try {
      const collectionManager = await this.app.container.make(CollectionManagerService)
      console.log('✅ CollectionManagerService enregistré avec succès ' + collectionManager)
    } catch (error) {
      console.warn("⚠️ Erreur lors de l'initialisation de CollectionManagerService:", error.message)
    }
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
