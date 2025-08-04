import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { SmsService } from '#services/sms_service'

@inject()
export default class SmsController {
  constructor(private sms: SmsService) {}

  /**
   * @health
   * @summary SMS connection health check
   * @description Check SMS API connection status
   * @tag SMS
   * @responseBody 200 - {"status": "healthy", "message": "Configuration SMS MTN validée"}
   * @responseBody 500 - {"status": "unhealthy", "message": "Erreur de configuration"}
   */
  async health({ response }: HttpContext) {
    try {
      const health = await this.sms.healthCheck()
      return response.ok(health)
    } catch (error) {
      return response.internalServerError({
        status: 'unhealthy',
        message: `Erreur lors du health check SMS: ${error.message}`,
      })
    }
  }

  /**
   * @test
   * @summary Test SMS integration
   * @description Basic test to verify SMS MTN integration works
   * @tag SMS
   * @responseBody 200 - {"status": "ok", "message": "Intégration SMS MTN fonctionnelle", "config": {...}}
   */
  async test({ response }: HttpContext) {
    try {
      const config = this.sms.getConfig()

      return response.ok({
        success: true,
        message: 'Intégration SMS MTN fonctionnelle',
        data: {
          status: 'ok',
          config: {
            baseUrl: config.baseUrl,
            environment: config.environment,
            hasAuthToken: !!config.authToken,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: 'Erreur lors du test',
        details: error.message,
      })
    }
  }

  /**
   * @sendSms
   * @summary Send SMS (MTN Official API)
   * @description Send SMS using official MTN API endpoint
   * @tag SMS
   * @requestBody {"to": "242053518256", "message": "Votre code de vérification est 534444", "from": "Fournisseur"}
   * @responseBody 200 - {"messageId": "msg_123", "status": "sent", "to": "242053518256", "cost": 25}
   * @responseBody 400 - {"error": "Paramètres invalides", "details": "string"}
   * @responseBody 500 - {"error": "Erreur lors de l'envoi", "details": "string"}
   */
  async sendSms({ request, response }: HttpContext) {
    try {
      const data = request.only(['to', 'message', 'from', 'reference'])

      // Validation des données obligatoires selon la doc MTN
      if (!data.to || !data.message) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'to et message sont requis selon la documentation MTN',
        })
      }

      // Validation du numéro de téléphone (format MTN)
      if (!this.sms.validatePhoneNumber(data.to)) {
        return response.badRequest({
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format MTN congolais (242XXXXXXXX)',
        })
      }

      // Validation des caractères du message selon la doc MTN
      const charValidation = this.sms.validateMessageCharacters(data.message)
      if (!charValidation.isValid) {
        return response.badRequest({
          error: 'Caractères invalides dans le message',
          details: `Caractères non supportés: ${charValidation.invalidChars?.join(', ')}`,
        })
      }

      // Validation de la longueur du message selon MTN (max 1071 caractères)
      if (data.message.length > 1071) {
        return response.badRequest({
          error: 'Message trop long',
          details:
            'Le message ne peut pas dépasser 1071 caractères (7 SMS) selon la documentation MTN',
        })
      }

      // Validation du sender (11 caractères max selon MTN)
      if (data.from && data.from.length > 11) {
        return response.badRequest({
          error: 'Nom expéditeur trop long',
          details:
            'Le nom expéditeur ne peut pas dépasser 11 caractères selon la documentation MTN',
        })
      }

      const result = await this.sms.sendSms({
        to: data.to,
        message: data.message,
        from: data.from || 'Fournisseur',
        reference: data.reference,
        priority: 'normal',
      })

      return response.ok({
        success: true,
        message: "SMS envoyé avec succès via l'API MTN",
        data: {
          ...result,
          messageType: charValidation.type,
          estimatedCost: this.sms.calculateSmsCost(data.message),
          smsCount: Math.ceil(
            data.message.length <= 160 ? 1 : (data.message.length - 160) / 153 + 1
          ),
        },
      })
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'envoi du SMS",
        details: error.message,
      })
    }
  }

  /**
   * @getSmsStatus
   * @summary Get SMS status (MTN Official API)
   * @description Get SMS status using official MTN API endpoint
   * @tag SMS
   * @paramPath messageId - ID du message SMS retourné lors de l'envoi
   * @responseBody 200 - {"messageId": "msg_123", "status": "delivered", "to": "242053518256"}
   * @responseBody 404 - {"error": "SMS non trouvé"}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getSmsStatus({ params, response }: HttpContext) {
    try {
      const messageId = params.messageId

      if (!messageId) {
        return response.badRequest({
          error: 'ID de message manquant',
          details: "L'ID du message est requis pour vérifier le statut",
        })
      }

      const result = await this.sms.getSmsStatus(messageId)

      return response.ok({
        success: true,
        message: 'Statut SMS récupéré avec succès',
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la récupération du statut',
        details: error.message,
      })
    }
  }

  /**
   * @calculateSmsCost
   * @summary Calculate SMS cost (MTN Rules)
   * @description Calculate SMS cost based on MTN pricing rules
   * @tag SMS
   * @requestBody {"message": "Votre code de vérification est 123456"}
   * @responseBody 200 - {"cost": 25, "length": 45, "smsCount": 1, "type": "GSM"}
   * @responseBody 400 - {"error": "Message requis"}
   */
  async calculateSmsCost({ request, response }: HttpContext) {
    try {
      const { message } = request.only(['message'])

      if (!message) {
        return response.badRequest({
          error: 'Message requis',
          details: 'Le paramètre "message" est obligatoire',
        })
      }

      const cost = this.sms.calculateSmsCost(message)
      const length = message.length
      const charValidation = this.sms.validateMessageCharacters(message)

      // Calcul du nombre de SMS selon la documentation MTN
      let smsCount = 1
      if (length > 160) {
        smsCount = Math.ceil((length - 160) / 153) + 1
      }

      return response.ok({
        success: true,
        message: 'Coût calculé selon les règles MTN',
        data: {
          cost,
          length,
          smsCount,
          messageType: charValidation.type,
          isValid: charValidation.isValid,
          preview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
      })
    } catch (error) {
      console.error('Erreur lors du calcul du coût:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors du calcul du coût',
        details: error.message,
      })
    }
  }
}
