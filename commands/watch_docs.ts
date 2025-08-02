import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export default class WatchDocs extends BaseCommand {
  static commandName = 'docs:watch'
  static description =
    'Surveille les changements dans routes.ts et régénère automatiquement la documentation'

  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: true,
  }

  @flags.boolean({
    description: 'Mode verbose avec plus de détails',
    alias: 'v',
  })
  declare verbose: boolean

  @flags.number({
    description: 'Intervalle de vérification en millisecondes',
    alias: 'i',
    default: 1000,
  })
  declare interval: number

  async run() {
    const routesFile = path.join(process.cwd(), 'start', 'routes.ts')
    let lastModified = 0

    this.logger.info('👀 Surveillance des changements dans routes.ts')
    this.logger.info(`📁 Fichier surveillé: ${routesFile}`)
    this.logger.info(`⏱️  Intervalle: ${this.interval}ms`)
    this.logger.info('🔄 Régénération automatique activée')
    this.logger.info('⏹️  Appuyez sur Ctrl+C pour arrêter')

    const checkFile = () => {
      try {
        const stats = fs.statSync(routesFile)
        if (stats.mtime.getTime() > lastModified) {
          lastModified = stats.mtime.getTime()

          this.logger.info('📝 Changement détecté dans routes.ts')
          this.logger.info('🔄 Régénération de la documentation...')

          // Régénérer la documentation
          const generateProcess = spawn('node', ['ace', 'docs:generate'], {
            stdio: 'pipe',
            cwd: process.cwd(),
          })

          generateProcess.stdout?.on('data', (data) => {
            if (this.verbose) {
              this.logger.info(data.toString().trim())
            }
          })

          generateProcess.stderr?.on('data', (data) => {
            this.logger.error(data.toString().trim())
          })

          generateProcess.on('close', (code) => {
            if (code === 0) {
              this.logger.success('✅ Documentation régénérée avec succès!')
            } else {
              this.logger.error(`❌ Erreur lors de la régénération (code: ${code})`)
            }
          })
        }
      } catch (error) {
        this.logger.error(`❌ Erreur lors de la vérification du fichier: ${error.message}`)
      }
    }

    // Vérifier immédiatement
    checkFile()

    // Vérifier périodiquement
    const interval = setInterval(checkFile, this.interval)

    // Gérer l'arrêt propre
    process.on('SIGINT', () => {
      this.logger.info('\n🛑 Arrêt de la surveillance...')
      clearInterval(interval)
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      this.logger.info('\n🛑 Arrêt de la surveillance...')
      clearInterval(interval)
      process.exit(0)
    })
  }
}
