import type { ApplicationService } from '@adonisjs/core/types'
import { SpaarkPayService } from '#services/spaark_pay_service'

export default class SpaarkPayProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(SpaarkPayService, () => {
      return new SpaarkPayService({
        environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
        timeout: 30000,
        retries: 3,
      })
    })
  }

  async boot() {
    // Vérification de la connexion au démarrage
    try {
      const spaarkPay = await this.app.container.make(SpaarkPayService)
      const health = await spaarkPay.healthCheck()

      if (health.status === 'healthy') {
        console.log('✅ Spaark Pay Service connecté avec succès')
      } else {
        console.warn('⚠️ Spaark Pay Service: connexion problématique')
        console.warn(health.message)
      }
    } catch (error) {
      console.warn("⚠️ Erreur lors de l'initialisation de Spaark Pay Service:", error.message)
    }
  }

  async shutdown() {}
}
