import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { SmsService } from '#services/sms_service'
import type { SendSmsRequest, SmsWebhookRequest, SmsWebhookConfig } from '#types/sms_types'

@inject()
export default class SmsController {
  constructor(private sms: SmsService) {}

  /**
   * @health
   * @summary SMS connection health check
   * @description Check SMS API connection status
   * @tag SMS
   * @responseBody 200 - {"status": "healthy", "message": "Connexion à SMS API établie"}
   * @responseBody 500 - {"status": "unhealthy", "message": "Erreur de connexion"}
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
   * @description Basic test to verify integration works
   * @tag SMS
   * @responseBody 200 - {"status": "ok", "message": "Intégration SMS fonctionnelle", "config": {...}}
   */
  async test({ response }: HttpContext) {
    try {
      const config = this.sms.getConfig()

      return response.ok({
        success: true,
        message: 'Intégration SMS fonctionnelle',
        data: {
          status: 'ok',
          config: {
            baseUrl: config.baseUrl,
            environment: config.environment,
            hasApiKey: !!config.apiKey,
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
   * @summary Send SMS
   * @description Send SMS to phone number
   * @tag SMS
   * @requestBody {"to": "053518256", "message": "Votre code de vérification est 123456", "from": "Fournisseur", "reference": "VERIFY_001"}
   * @responseBody 200 - {"messageId": "msg_123", "status": "sent", "to": "053518256", "cost": 25}
   * @responseBody 400 - {"error": "Paramètres invalides", "details": "string"}
   * @responseBody 500 - {"error": "Erreur lors de l'envoi", "details": "string"}
   */
  async sendSms({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'to',
        'message',
        'from',
        'reference',
        'priority',
      ]) as SendSmsRequest

      // Validation des données
      if (!data.to || !data.message) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'to et message sont requis',
        })
      }

      // Validation du numéro de téléphone
      const phoneRegex = /^0[5-7][0-9]{7}$/
      if (!phoneRegex.test(data.to)) {
        return response.badRequest({
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format congolais (0XXXXXXXX)',
        })
      }

      // Validation de la longueur du message
      if (data.message.length > 160) {
        return response.badRequest({
          error: 'Message trop long',
          details: 'Le message ne peut pas dépasser 160 caractères',
        })
      }

      const result = await this.sms.sendSms(data)

      return response.ok({
        success: true,
        message: 'SMS envoyé avec succès',
        data: result,
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
   * @summary Get SMS status
   * @description Get SMS status by message ID
   * @tag SMS
   * @paramPath messageId - ID du message SMS
   * @responseBody 200 - {"messageId": "msg_123", "status": "delivered", "to": "053518256", "deliveredAt": "2025-08-02T15:30:00Z"}
   * @responseBody 404 - {"error": "SMS non trouvé"}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getSmsStatus({ params, response }: HttpContext) {
    try {
      const messageId = params.messageId

      if (!messageId) {
        return response.badRequest({
          error: 'ID de message manquant',
          details: "L'ID du message est requis",
        })
      }

      const result = await this.sms.getSmsStatus(messageId)

      return response.ok({
        success: true,
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
   * @getSmsHistory
   * @summary Get SMS history
   * @description Get SMS sending history
   * @tag SMS
   * @queryParam page - Numéro de page (défaut: 1)
   * @queryParam limit - Nombre d'éléments par page (défaut: 50)
   * @responseBody 200 - {"messages": [{"id": "msg_123", "to": "053518256", "status": "delivered"}], "total": 100}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getSmsHistory({ request, response }: HttpContext) {
    try {
      const page = Number.parseInt(request.input('page', '1'))
      const limit = Number.parseInt(request.input('limit', '50'))

      if (page < 1 || limit < 1 || limit > 100) {
        return response.badRequest({
          error: 'Paramètres de pagination invalides',
          details: 'page >= 1, limit >= 1 et <= 100',
        })
      }

      const result = await this.sms.getSmsHistory(page, limit)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de la récupération de l'historique",
        details: error.message,
      })
    }
  }

  /**
   * @getSmsStats
   * @summary Get SMS statistics
   * @description Get SMS sending statistics
   * @tag SMS
   * @queryParam startDate - Date de début (format: YYYY-MM-DD)
   * @queryParam endDate - Date de fin (format: YYYY-MM-DD)
   * @responseBody 200 - {"total": 1000, "sent": 950, "delivered": 900, "failed": 50, "totalCost": 25000}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getSmsStats({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      // Validation des dates si fournies
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return response.badRequest({
          error: 'Format de date invalide',
          details: 'startDate doit être au format YYYY-MM-DD',
        })
      }

      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return response.badRequest({
          error: 'Format de date invalide',
          details: 'endDate doit être au format YYYY-MM-DD',
        })
      }

      const result = await this.sms.getSmsStats(startDate, endDate)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        details: error.message,
      })
    }
  }

  /**
   * @processWebhook
   * @summary Process SMS webhook
   * @description Process SMS status notifications
   * @tag SMS
   * @requestBody {"messageId": "msg_123", "status": "delivered", "to": "053518256", "timestamp": "2025-08-02T15:30:00Z"}
   * @responseBody 200 - {"received": true, "processed": true}
   * @responseBody 400 - {"error": "Données webhook invalides"}
   */
  async processWebhook({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'messageId',
        'status',
        'to',
        'from',
        'timestamp',
        'failureReason',
      ]) as SmsWebhookRequest

      if (!data.messageId || !data.status || !data.to || !data.timestamp) {
        return response.badRequest({
          error: 'Données webhook invalides',
          details: 'messageId, status, to et timestamp sont requis',
        })
      }

      if (!['delivered', 'failed'].includes(data.status)) {
        return response.badRequest({
          error: 'Statut invalide',
          details: 'Le statut doit être "delivered" ou "failed"',
        })
      }

      const result = await this.sms.processWebhook(data)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors du traitement du webhook',
        details: error.message,
      })
    }
  }

  /**
   * @configureWebhook
   * @summary Configure SMS webhook
   * @description Configure webhook for status notifications
   * @tag SMS
   * @requestBody {"url": "https://api.arkelys.cloud/webhook/sms", "events": ["delivered", "failed"], "secret": "webhook_secret"}
   * @responseBody 201 - {"id": "webhook_123", "url": "https://api.arkelys.cloud/webhook/sms", "isActive": true}
   * @responseBody 400 - {"error": "Configuration invalide"}
   * @responseBody 500 - {"error": "Erreur lors de la configuration", "details": "string"}
   */
  async configureWebhook({ request, response }: HttpContext) {
    try {
      const data = request.only(['url', 'events', 'secret']) as SmsWebhookConfig

      if (!data.url || !data.events || !Array.isArray(data.events)) {
        return response.badRequest({
          error: 'Configuration invalide',
          details: 'url et events (tableau) sont requis',
        })
      }

      // Validation de l'URL
      try {
        new URL(data.url)
      } catch {
        return response.badRequest({
          error: 'URL invalide',
          details: "L'URL doit être valide",
        })
      }

      // Validation des événements
      const validEvents = ['delivered', 'failed']
      if (!data.events.every((event) => validEvents.includes(event))) {
        return response.badRequest({
          error: 'Événements invalides',
          details: 'Les événements doivent être "delivered" et/ou "failed"',
        })
      }

      const result = await this.sms.configureWebhook(data)

      return response.created({
        success: true,
        data: result,
        message: 'Webhook configuré avec succès',
      })
    } catch (error) {
      console.error('Erreur lors de la configuration du webhook:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la configuration du webhook',
        details: error.message,
      })
    }
  }

  /**
   * @sendTestSms
   * @summary Send test SMS
   * @description Send test SMS to verify connection
   * @tag SMS
   * @requestBody {"to": "053518256"}
   * @responseBody 200 - {"messageId": "msg_123", "status": "sent", "to": "053518256"}
   * @responseBody 400 - {"error": "Numéro invalide"}
   * @responseBody 500 - {"error": "Erreur lors de l'envoi", "details": "string"}
   */
  async sendTestSms({ request, response }: HttpContext) {
    try {
      const { to } = request.only(['to'])

      if (!to) {
        return response.badRequest({
          error: 'Numéro de téléphone requis',
          details: 'Le paramètre "to" est obligatoire',
        })
      }

      // Validation du numéro de téléphone
      if (!this.sms.validatePhoneNumber(to)) {
        return response.badRequest({
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format congolais (0XXXXXXXX)',
        })
      }

      const result = await this.sms.sendTestSms(to)

      return response.ok({
        success: true,
        message: 'SMS de test envoyé avec succès',
        data: result,
      })
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS de test:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'envoi du SMS de test",
        details: error.message,
      })
    }
  }

  /**
   * @sendOtpSms
   * @summary Send OTP SMS
   * @description Send SMS with verification code
   * @tag SMS
   * @requestBody {"to": "053518256", "code": "123456", "expiresIn": 5}
   * @responseBody 200 - {"messageId": "msg_123", "status": "sent", "to": "053518256"}
   * @responseBody 400 - {"error": "Paramètres invalides"}
   * @responseBody 500 - {"error": "Erreur lors de l'envoi", "details": "string"}
   */
  async sendOtpSms({ request, response }: HttpContext) {
    try {
      const { to, code, expiresIn } = request.only(['to', 'code', 'expiresIn'])

      if (!to || !code) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'to et code sont requis',
        })
      }

      // Validation du numéro de téléphone
      if (!this.sms.validatePhoneNumber(to)) {
        return response.badRequest({
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format congolais (0XXXXXXXX)',
        })
      }

      // Validation du code OTP
      if (!/^\d{4,6}$/.test(code)) {
        return response.badRequest({
          error: 'Code OTP invalide',
          details: 'Le code doit contenir 4 à 6 chiffres',
        })
      }

      const result = await this.sms.sendOtpSms(to, code, expiresIn || 5)

      return response.ok({
        success: true,
        message: 'SMS OTP envoyé avec succès',
        data: result,
      })
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS OTP:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'envoi du SMS OTP",
        details: error.message,
      })
    }
  }

  /**
   * @sendNotificationSms
   * @summary Send notification SMS
   * @description Send notification SMS with title and message
   * @tag SMS
   * @requestBody {"to": "053518256", "title": "Commande", "message": "Votre commande a été confirmée"}
   * @responseBody 200 - {"messageId": "msg_123", "status": "sent", "to": "053518256"}
   * @responseBody 400 - {"error": "Paramètres invalides"}
   * @responseBody 500 - {"error": "Erreur lors de l'envoi", "details": "string"}
   */
  async sendNotificationSms({ request, response }: HttpContext) {
    try {
      const { to, title, message } = request.only(['to', 'title', 'message'])

      if (!to || !title || !message) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'to, title et message sont requis',
        })
      }

      // Validation du numéro de téléphone
      if (!this.sms.validatePhoneNumber(to)) {
        return response.badRequest({
          error: 'Format de numéro invalide',
          details: 'Le numéro doit être au format congolais (0XXXXXXXX)',
        })
      }

      // Validation de la longueur du titre et message
      if (title.length > 50) {
        return response.badRequest({
          error: 'Titre trop long',
          details: 'Le titre ne peut pas dépasser 50 caractères',
        })
      }

      if (message.length > 110) {
        return response.badRequest({
          error: 'Message trop long',
          details: 'Le message ne peut pas dépasser 110 caractères (avec le titre)',
        })
      }

      const result = await this.sms.sendNotificationSms(to, title, message)

      return response.ok({
        success: true,
        message: 'SMS de notification envoyé avec succès',
        data: result,
      })
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS de notification:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'envoi du SMS de notification",
        details: error.message,
      })
    }
  }

  /**
   * @checkBalance
   * @summary Check SMS balance
   * @description Get current SMS account balance
   * @tag SMS
   * @responseBody 200 - {"balance": 1000, "currency": "XAF"}
   * @responseBody 500 - {"error": "Erreur lors de la vérification", "details": "string"}
   */
  async checkBalance({ response }: HttpContext) {
    try {
      const result = await this.sms.checkBalance()

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la vérification du solde:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la vérification du solde',
        details: error.message,
      })
    }
  }

  /**
   * @calculateSmsCost
   * @summary Calculate SMS cost
   * @description Calculate SMS cost based on message length
   * @tag SMS
   * @requestBody {"message": "Votre code de vérification est 123456"}
   * @responseBody 200 - {"cost": 25, "length": 45, "smsCount": 1}
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
      const smsCount = Math.ceil(length / 160)

      return response.ok({
        success: true,
        data: {
          cost,
          length,
          smsCount,
          message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
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

  /**
   * @getApiInfo
   * @summary Get SMS API info
   * @description Get SMS API information (version, features, limits)
   * @tag SMS
   * @responseBody 200 - {"version": "1.0.0", "features": ["sms", "webhook"], "limits": {...}}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getApiInfo({ response }: HttpContext) {
    try {
      const result = await this.sms.getApiInfo()

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des informations API:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la récupération des informations API',
        details: error.message,
      })
    }
  }
}
