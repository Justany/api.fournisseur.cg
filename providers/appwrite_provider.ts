import type { ApplicationService } from '@adonisjs/core/types'
import { AppwriteService } from '#services/appwrite_service'

export default class AppwriteProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton(AppwriteService, () => {
      return new AppwriteService()
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    // Vérifier la connexion Appwrite au démarrage
    const appwrite = await this.app.container.make(AppwriteService)
    const health = await appwrite.healthCheck()

    if (health.status === 'unhealthy') {
      console.warn('⚠️  Appwrite connection unhealthy:', health.error)
    } else {
      console.log('✅ Appwrite connected successfully:', health.databases, 'databases found')
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
