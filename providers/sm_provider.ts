import type { ApplicationService } from '@adonisjs/core/types'
import { SmsService } from '#services/sms_service'

export default class SmProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    // Enregistrer le service SMS
    console.log('📱 SMS Provider enregistré')
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    // Vérifier la connexion SMS au démarrage
    try {
      const smsService = new SmsService()
      const health = await smsService.healthCheck()

      if (health.status === 'healthy') {
        console.log('✅ SMS Service connecté avec succès')
      } else {
        console.warn('⚠️ SMS Service: connexion problématique')
        console.warn(`Erreur de connexion: ${health.message}`)
      }
    } catch (error) {
      console.error('❌ SMS Service: échec de connexion')
      console.error(`Erreur: ${error.message}`)
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
