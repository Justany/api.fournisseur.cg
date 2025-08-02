import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { SpaarkPayService } from '#services/spaark_pay_service'
import type {
  InitiatePaymentRequest,
  VerifyPaymentRequest,
  VerifyPaymentByIdRequest,
  WebhookRequest,
  AddDomainRequest,
  ValidateDomainRequest,
} from '#types/spaark_pay_types'

@inject()
export default class SpaarkPaysController {
  constructor(private spaarkPay: SpaarkPayService) {}

  /**
   * @health
   * @summary Spaark Pay connection health check
   * @description Check Spaark Pay API connection status
   * @tag Payments
   * @responseBody 200 - {"status": "healthy", "message": "Connexion à Spaark Pay API établie"}
   * @responseBody 500 - {"status": "unhealthy", "message": "Erreur de connexion"}
   */
  async health({ response }: HttpContext) {
    try {
      const health = await this.spaarkPay.healthCheck()
      return response.ok(health)
    } catch (error) {
      return response.internalServerError({
        status: 'unhealthy',
        message: `Erreur lors du health check Spaark Pay: ${error.message}`,
      })
    }
  }

  /**
   * @initiatePayment
   * @summary Initiate mobile money payment
   * @description Initiate mobile money transaction (Airtel Money, MTN Mobile Money)
   * @tag Payments
   * @requestBody {"phone": "053518256", "amount": 150, "mode": "airtel", "reference": "ORDER_123"}
   * @responseBody 200 - {"status": 200, "message": "Paiement initié avec succès", "paymentId": 28, "token": "28257ddbaf7a11ef86feac1f6be4442c", "composition": "*128*128*1159*PIN#", "transID": "JKUCJDFLIKDGDGD-328"}
   * @responseBody 400 - {"error": "Paramètres invalides", "details": "string"}
   * @responseBody 500 - {"error": "Erreur lors de l'initiation", "details": "string"}
   */
  async initiatePayment({ request, response }: HttpContext) {
    try {
      const data = request.only(['phone', 'amount', 'mode', 'reference']) as InitiatePaymentRequest

      // Validation des données
      if (!data.phone || !data.amount || !data.mode) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'phone, amount et mode sont requis',
        })
      }

      if (!['airtel', 'momo'].includes(data.mode)) {
        return response.badRequest({
          error: 'Mode invalide',
          details: 'Le mode doit être "airtel" ou "momo"',
        })
      }

      if (data.amount <= 0) {
        return response.badRequest({
          error: 'Montant invalide',
          details: 'Le montant doit être supérieur à 0',
        })
      }

      const result = await this.spaarkPay.initiatePayment(data)

      return response.ok({
        success: true,
        message: 'Paiement initié avec succès',
        data: result,
      })
    } catch (error) {
      console.error("Erreur lors de l'initiation du paiement:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'initiation du paiement",
        details: error.message,
      })
    }
  }

  /**
   * @getPaymentStatus
   * @summary Get payment status
   * @description Get payment status with automatic verification if needed
   * @tag Payments
   * @paramPath paymentId - ID du paiement
   * @responseBody 200 - {"status": "completed", "amount": 150, "phone": "053518256", "mode": "airtel", "reference": "PAY_REF_123", "externalStatus": "SUCCESSFUL", "autoVerified": false}
   * @responseBody 404 - {"error": "Paiement non trouvé"}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getPaymentStatus({ params, response }: HttpContext) {
    try {
      const paymentId = Number.parseInt(params.paymentId)

      if (Number.isNaN(paymentId)) {
        return response.badRequest({
          error: 'ID de paiement invalide',
          details: "L'ID doit être un nombre",
        })
      }

      const result = await this.spaarkPay.getPaymentStatus(paymentId)

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
   * @verifyPayment
   * @summary Verify payment by token
   * @description Force external verification of payment by token
   * @tag Payments
   * @requestBody {"token": "414754bb67b811f08f9bac1f6be4442c", "mode": "airtel"}
   * @responseBody 200 - {"paymentId": 123, "status": "completed", "externalStatus": "SUCCESSFUL", "verifiedExternally": true}
   * @responseBody 400 - {"error": "Paramètres manquants"}
   * @responseBody 500 - {"error": "Erreur lors de la vérification", "details": "string"}
   */
  async verifyPayment({ request, response }: HttpContext) {
    try {
      const data = request.only(['token', 'mode']) as VerifyPaymentRequest

      if (!data.token || !data.mode) {
        return response.badRequest({
          error: 'Paramètres manquants',
          details: 'token et mode sont requis',
        })
      }

      if (!['airtel', 'momo'].includes(data.mode)) {
        return response.badRequest({
          error: 'Mode invalide',
          details: 'Le mode doit être "airtel" ou "momo"',
        })
      }

      const result = await this.spaarkPay.verifyPayment(data)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la vérification du paiement',
        details: error.message,
      })
    }
  }

  /**
   * @verifyPaymentById
   * @summary Verify payment by ID
   * @description Force external verification of payment by ID
   * @tag Payments
   * @requestBody {"paymentId": 123}
   * @responseBody 200 - {"paymentId": 123, "status": "completed", "externalStatus": "SUCCESSFUL", "verifiedExternally": true}
   * @responseBody 400 - {"error": "ID manquant"}
   * @responseBody 500 - {"error": "Erreur lors de la vérification", "details": "string"}
   */
  async verifyPaymentById({ request, response }: HttpContext) {
    try {
      const data = request.only(['paymentId']) as VerifyPaymentByIdRequest

      if (!data.paymentId) {
        return response.badRequest({
          error: 'ID manquant',
          details: 'paymentId est requis',
        })
      }

      const result = await this.spaarkPay.verifyPaymentById(data.paymentId)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la vérification du paiement',
        details: error.message,
      })
    }
  }

  /**
   * @processWebhook
   * @summary Process payment webhook
   * @description Process payment notifications from Spaark Pay
   * @tag Payments
   * @requestBody {"reference": "PAY_REF_123", "status": "COMPLETED", "transactionId": "TXN_123456"}
   * @responseBody 200 - {"received": true}
   * @responseBody 400 - {"error": "Données webhook invalides"}
   */
  async processWebhook({ request, response }: HttpContext) {
    try {
      const data = request.only(['reference', 'status', 'transactionId']) as WebhookRequest

      if (!data.reference || !data.status || !data.transactionId) {
        return response.badRequest({
          error: 'Données webhook invalides',
          details: 'reference, status et transactionId sont requis',
        })
      }

      if (!['COMPLETED', 'FAILED'].includes(data.status)) {
        return response.badRequest({
          error: 'Statut invalide',
          details: 'Le statut doit être "COMPLETED" ou "FAILED"',
        })
      }

      const result = await this.spaarkPay.processWebhook(data)

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
   * @getTransactionHistory
   * @summary Get transaction history
   * @description Get complete user transaction history
   * @tag Payments
   * @responseBody 200 - {"transactions": [{"id": 1, "amount": 150, "phone": "053518256", "mode": "airtel", "status": "COMPLETED"}]}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getTransactionHistory({ response }: HttpContext) {
    try {
      const transactions = await this.spaarkPay.getTransactionHistory()

      return response.ok({
        success: true,
        data: {
          transactions,
          total: transactions.length,
        },
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
   * @getDomains
   * @summary Get domains list
   * @description Get whitelisted domains list
   * @tag Domains
   * @responseBody 200 - {"domains": [{"id": 1, "domain": "example.com", "status": "APPROVED"}]}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getDomains({ response }: HttpContext) {
    try {
      const domains = await this.spaarkPay.getDomains()

      return response.ok({
        success: true,
        data: {
          domains,
          total: domains.length,
        },
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des domaines:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la récupération des domaines',
        details: error.message,
      })
    }
  }

  /**
   * @addDomain
   * @summary Add new domain
   * @description Add new domain pending validation
   * @tag Domains
   * @requestBody {"domain": "example.com"}
   * @responseBody 201 - {"domain": {"id": 1, "domain": "example.com", "status": "PENDING"}}
   * @responseBody 400 - {"error": "Domaine manquant"}
   * @responseBody 500 - {"error": "Erreur lors de l'ajout", "details": "string"}
   */
  async addDomain({ request, response }: HttpContext) {
    try {
      const data = request.only(['domain']) as AddDomainRequest

      if (!data.domain) {
        return response.badRequest({
          error: 'Domaine manquant',
          details: 'Le domaine est requis',
        })
      }

      const domain = await this.spaarkPay.addDomain(data)

      return response.created({
        success: true,
        data: { domain },
        message: 'Domaine ajouté avec succès. En attente de validation par un administrateur.',
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout du domaine:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'ajout du domaine",
        details: error.message,
      })
    }
  }

  /**
   * @validateDomain
   * @summary Validate or reject domain
   * @description Validate or reject domain (ADMIN only)
   * @tag Domains
   * @paramPath domainId - ID du domaine
   * @requestBody {"status": "APPROVED", "reason": "Domaine valide"}
   * @responseBody 200 - {"domain": {"id": 1, "domain": "example.com", "status": "APPROVED"}}
   * @responseBody 400 - {"error": "Statut invalide"}
   * @responseBody 500 - {"error": "Erreur lors de la validation", "details": "string"}
   */
  async validateDomain({ params, request, response }: HttpContext) {
    try {
      const domainId = Number.parseInt(params.domainId)
      const data = request.only(['status', 'reason']) as ValidateDomainRequest

      if (Number.isNaN(domainId)) {
        return response.badRequest({
          error: 'ID de domaine invalide',
          details: "L'ID doit être un nombre",
        })
      }

      if (!data.status) {
        return response.badRequest({
          error: 'Statut manquant',
          details: 'Le statut est requis',
        })
      }

      if (!['APPROVED', 'REJECTED'].includes(data.status)) {
        return response.badRequest({
          error: 'Statut invalide',
          details: 'Le statut doit être "APPROVED" ou "REJECTED"',
        })
      }

      if (data.status === 'REJECTED' && !data.reason) {
        return response.badRequest({
          error: 'Raison manquante',
          details: 'Une raison est requise pour rejeter un domaine',
        })
      }

      const domain = await this.spaarkPay.validateDomain(domainId, data)

      return response.ok({
        success: true,
        data: { domain },
      })
    } catch (error) {
      console.error('Erreur lors de la validation du domaine:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la validation du domaine',
        details: error.message,
      })
    }
  }

  /**
   * @getDomainStats
   * @summary Get domain statistics
   * @description Get whitelisted domains statistics
   * @tag Domains
   * @responseBody 200 - {"total": 10, "active": 8, "pending": 1, "rejected": 1}
   * @responseBody 500 - {"error": "Erreur lors de la récupération", "details": "string"}
   */
  async getDomainStats({ response }: HttpContext) {
    try {
      const stats = await this.spaarkPay.getDomainStats()

      return response.ok({
        success: true,
        data: stats,
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
   * @generateApiKey
   * @summary Generate new API key
   * @description Generate new API key (test or production)
   * @tag Users
   * @paramPath type - Type de clé (test ou live)
   * @responseBody 200 - {"testApiKey": "tk_test_..."} ou {"liveApiKey": "tk_live_..."}
   * @responseBody 400 - {"error": "Type invalide"}
   * @responseBody 500 - {"error": "Erreur lors de la génération", "details": "string"}
   */
  async generateApiKey({ params, response }: HttpContext) {
    try {
      const type = params.type as 'test' | 'live'

      if (!['test', 'live'].includes(type)) {
        return response.badRequest({
          error: 'Type invalide',
          details: 'Le type doit être "test" ou "live"',
        })
      }

      const result = await this.spaarkPay.generateApiKey(type)

      return response.ok({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Erreur lors de la génération de la clé API:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la génération de la clé API',
        details: error.message,
      })
    }
  }

  /**
   * @test
   * @summary Test integration
   * @description Basic test to verify integration works
   * @tag Payments
   * @responseBody 200 - {"status": "ok", "message": "Intégration Spaark Pay fonctionnelle", "config": {...}}
   */
  async test({ response }: HttpContext) {
    try {
      const config = this.spaarkPay.getConfig()

      return response.ok({
        success: true,
        message: 'Intégration Spaark Pay fonctionnelle',
        data: {
          status: 'ok',
          config: {
            baseUrl: config.baseUrl,
            environment: config.environment,
            hasToken: !!config.token,
            hasTestApiKey: !!config.testApiKey,
            hasLiveApiKey: !!config.liveApiKey,
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
}
