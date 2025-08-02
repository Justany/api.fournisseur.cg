import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { SpaarkPayService } from '#services/spaark_pay_service'

export default class TestSpaarkPay extends BaseCommand {
  static commandName = 'spaark:test'
  static description = 'Tester l\'intégration Spaark Pay'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({
    description: 'Action à tester (health, config, domains)',
    required: false
  })
  declare action: string

  @flags.boolean({
    description: 'Mode verbose (plus de détails)',
    alias: 'v'
  })
  declare verbose: boolean

  async run() {
    const action = this.action || 'health'

    this.logger.info('🧪 Test de l\'intégration Spaark Pay')

    try {
      const spaarkPay = new SpaarkPayService()

      switch (action.toLowerCase()) {
        case 'health':
          await this.testHealth(spaarkPay)
          break

        case 'config':
          await this.testConfig(spaarkPay)
          break

        case 'domains':
          await this.testDomains(spaarkPay)
          break

        default:
          this.logger.error(`❌ Action inconnue: ${action}`)
          this.logger.info('Actions disponibles: health, config, domains')
          return
      }

    } catch (error) {
      this.logger.error('❌ Erreur lors du test Spaark Pay')
      this.logger.error(error.message)
      process.exit(1)
    }
  }

  private async testHealth(spaarkPay: SpaarkPayService) {
    this.logger.info('🔍 Test de la connexion Spaark Pay...')

    try {
      const health = await spaarkPay.healthCheck()

      if (health.status === 'healthy') {
        this.logger.success('✅ Connexion Spaark Pay établie')
        this.logger.info(`📝 Message: ${health.message}`)
      } else {
        this.logger.error('❌ Connexion Spaark Pay échouée')
        this.logger.error(health.message)
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors du health check:', error.message)
    }
  }

  private async testConfig(spaarkPay: SpaarkPayService) {
    this.logger.info('⚙️ Configuration Spaark Pay...')

    try {
      const config = spaarkPay.getConfig()

      this.logger.info('📋 Configuration actuelle:')
      this.logger.info(`   - Base URL: ${config.baseUrl}`)
      this.logger.info(`   - Environment: ${config.environment}`)
      this.logger.info(`   - Test API Key: ${config.testApiKey.substring(0, 20)}...`)
      this.logger.info(`   - Live API Key: ${config.liveApiKey.substring(0, 20)}...`)
      this.logger.info(`   - Token: ${config.token.substring(0, 20)}...`)

      if (this.verbose) {
        this.logger.info('🔍 Test de la configuration complète...')
        // Ici on pourrait ajouter des tests plus poussés
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération de la configuration:', error.message)
    }
  }

  private async testDomains(spaarkPay: SpaarkPayService) {
    this.logger.info('🌐 Test de la récupération des domaines...')

    try {
      const domains = await spaarkPay.getDomains()

      this.logger.success(`✅ ${domains.length} domaines récupérés`)

      if (domains.length > 0) {
        this.logger.info('📋 Domaines:')
        domains.forEach((domain, index) => {
          this.logger.info(`   ${index + 1}. ${domain.domain} (${domain.status})`)
        })
      } else {
        this.logger.info('ℹ️ Aucun domaine trouvé')
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des domaines:', error.message)
    }
  }
}
