import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PawaPayService } from '#services/pawapay_service'

@inject()
export default class PawaPayController {
  constructor(private pawapay: PawaPayService) {}

  /**
   * @availability
   * @summary PawaPay availability
   * @description Get PawaPay availability for a specific country
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"country": "COG", "available": true}}
   * @responseBody 500 - {"success": false, "error": "Availability fetch failed", "details": "Unknown error"}
   */
  async availability({ request, response }: HttpContext) {
    try {
      const { country } = request.qs()
      const data = await this.pawapay.availability(
        country ? String(country).toUpperCase() : undefined
      )
      return response.ok({ success: true, data })
    } catch (error: any) {
      const details = error?.response?.data || error?.message || 'Unknown error'
      return response.internalServerError({
        success: false,
        error: 'Availability fetch failed',
        details,
      })
    }
  }

  /**
   * @listProviders
   * @summary PawaPay providers per country
   * @description Get PawaPay providers per country (using active configuration)
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"country": "COG", "available": true}}
   * @responseBody 500 - {"success": false, "error": "Providers fetch failed", "details": "Unknown error"}
   */
  async listProviders({ request, response }: HttpContext) {
    try {
      const { country, operationType } = request.qs()
      if (!country) {
        return response.badRequest({
          success: false,
          error: 'Paramètre country requis (ISO3, ex: COG)',
        })
      }
      const data = await this.pawapay.activeConfiguration(
        String(country).toUpperCase(),
        operationType ? (String(operationType).toUpperCase() as 'DEPOSIT' | 'PAYOUT') : undefined
      )
      // Try to map to a simplified list if possible; otherwise return raw
      const providers = Array.isArray((data as any)?.correspondents)
        ? (data as any).correspondents.map((c: any) => ({
            provider: c?.provider,
            country: c?.country,
            currency: c?.currency,
            authorisation: c?.authorisation,
            decimals: c?.decimals,
            operationTypes: c?.operationTypes,
          }))
        : undefined

      return response.ok({ success: true, data: providers ?? data })
    } catch (error: any) {
      const details = error?.response?.data || error?.message || 'Unknown error'
      return response.internalServerError({
        success: false,
        error: 'Providers fetch failed',
        details,
      })
    }
  }

  /**
   * @getActiveConfiguration
   * @summary PawaPay active configuration
   * @description Get PawaPay active configuration for a specific country
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"country": "COG", "available": true}}
   * @responseBody 500 - {"success": false, "error": "Active configuration fetch failed", "details": "Unknown error"}
   */
  async getActiveConfiguration({ request, response }: HttpContext) {
    try {
      const { country, operationType } = request.qs()
      if (!country) {
        return response.badRequest({
          success: false,
          error: 'Paramètre country requis (ISO3, ex: COG)',
        })
      }
      const data = await this.pawapay.activeConfiguration(
        String(country).toUpperCase(),
        operationType ? (String(operationType).toUpperCase() as 'DEPOSIT' | 'PAYOUT') : undefined
      )
      return response.ok({ success: true, data })
    } catch (error: any) {
      const details = error?.response?.data || error?.message || 'Unknown error'
      return response.internalServerError({
        success: false,
        error: 'Active configuration fetch failed',
        details,
      })
    }
  }

  /**
   * @requestDeposit
   * @summary PawaPay request deposit
   * @description Request a deposit using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"depositId": "uuid", "amount": "15", "currency": "XAF", "payer": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Deposit request failed", "details": "Unknown error"}
   */
  async requestDeposit({ request, response }: HttpContext) {
    try {
      const body = request.body()

      // Minimal required fields for v2
      const hasBasic = body?.depositId && body?.amount && body?.currency
      const hasPayerMMO =
        body?.payer?.type === 'MMO' &&
        !!body?.payer?.accountDetails?.provider &&
        !!body?.payer?.accountDetails?.phoneNumber

      if (!hasBasic || !hasPayerMMO) {
        return response.badRequest({
          success: false,
          error:
            'Champs requis manquants. Requis: depositId, amount, currency, payer.type="MMO", payer.accountDetails.provider, payer.accountDetails.phoneNumber',
          example: {
            depositId: 'uuid',
            amount: '15',
            currency: 'XAF',
            payer: {
              type: 'MMO',
              accountDetails: { provider: 'MTN_MOMO_COG', phoneNumber: '24206XXXXXX' },
            },
            clientReferenceId: 'INV-123456',
            customerMessage: 'Note of 4 to 22 chars',
            metadata: [
              { orderId: 'ORD-123456789' },
              { customerId: 'customer@email.com', isPII: true },
            ],
          },
        })
      }

      const result = await this.pawapay.requestDeposit(body)
      return response.ok({ success: true, data: result })
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        error: error.message,
        details: error?.response?.data,
      })
    }
  }

  /**
   * @checkDepositStatus
   * @summary PawaPay check deposit status
   * @description Check the status of a deposit using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"depositId": "uuid", "amount": "15", "currency": "XAF", "payer": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Deposit request failed", "details": "Unknown error"}
   */
  async checkDepositStatus({ params, response }: HttpContext) {
    try {
      const { depositId } = params
      if (!depositId) return response.badRequest({ success: false, error: 'depositId requis' })
      const result = await this.pawapay.checkDepositStatus(depositId)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @requestPayout
   * @summary PawaPay request payout
   * @description Request a payout using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"payoutId": "uuid", "amount": "15", "currency": "XAF", "recipient": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Payout request failed", "details": "Unknown error"}
   */
  async requestPayout({ request, response }: HttpContext) {
    try {
      const body = request.body()

      const hasBasic = body?.payoutId && body?.amount && body?.currency
      // Accept either MSISDN recipient or MMO accountDetails (future-proof)
      const hasRecipient =
        (body?.recipient?.type === 'MSISDN' && !!body?.recipient?.address?.value) ||
        (body?.recipient?.type === 'MMO' &&
          !!body?.recipient?.accountDetails?.provider &&
          !!body?.recipient?.accountDetails?.phoneNumber)

      if (!hasBasic || !hasRecipient) {
        return response.badRequest({
          success: false,
          error:
            'Champs requis manquants. Requis: payoutId, amount, currency, recipient (MSISDN {address.value}) ou MMO {accountDetails.provider, accountDetails.phoneNumber}',
          example: {
            payoutId: 'uuid',
            amount: '15',
            currency: 'XAF',
            recipient: { type: 'MSISDN', address: { value: '24206XXXXXX' } },
            clientReferenceId: 'INV-123456',
            customerMessage: 'Note of 4 to 22 chars',
            metadata: [{ orderId: 'ORD-123456789' }],
          },
        })
      }

      const result = await this.pawapay.requestPayout(body)
      return response.ok({ success: true, data: result })
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        error: error.message,
        details: error?.response?.data,
      })
    }
  }

  /**
   * @checkPayoutStatus
   * @summary PawaPay check payout status
   * @description Check the status of a payout using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"payoutId": "uuid", "amount": "15", "currency": "XAF", "recipient": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Payout request failed", "details": "Unknown error"}
   */
  async checkPayoutStatus({ params, response }: HttpContext) {
    try {
      const { payoutId } = params
      if (!payoutId) return response.badRequest({ success: false, error: 'payoutId requis' })
      const result = await this.pawapay.checkPayoutStatus(payoutId)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @requestRefund
   * @summary PawaPay request refund
   * @description Request a refund using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"refundId": "uuid", "amount": "15", "currency": "XAF", "recipient": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Refund request failed", "details": "Unknown error"}
   */
  async requestRefund({ request, response }: HttpContext) {
    try {
      const body = request.only([
        'refundId',
        'originalDepositId',
        'amount',
        'statementDescription',
        'metadata',
      ])
      if (!body.refundId || !body.originalDepositId) {
        return response.badRequest({
          success: false,
          error: 'Paramètres requis: refundId, originalDepositId',
        })
      }
      const result = await this.pawapay.requestRefund(body)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @checkRefundStatus
   * @summary PawaPay check refund status
   * @description Check the status of a refund using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {"success": true, "data": {"refundId": "uuid", "amount": "15", "currency": "XAF", "recipient": {"type": "MMO", "accountDetails": {"provider": "MTN_MOMO_COG", "phoneNumber": "24206XXXXXX"}}}}
   * @responseBody 500 - {"success": false, "error": "Refund request failed", "details": "Unknown error"}
   */
  async checkRefundStatus({ params, response }: HttpContext) {
    try {
      const { refundId } = params
      if (!refundId) return response.badRequest({ success: false, error: 'refundId requis' })
      const result = await this.pawapay.checkRefundStatus(refundId)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @depositCallback
   * @summary PawaPay deposit callback
   * @description Handle deposit callback from PawaPay
   * @tag PawaPay
   * @responseBody 200 - {"received": true}
   * @responseBody 500 - {"success": false, "error": "Deposit callback failed", "details": "Unknown error"}
   */
  async depositCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      // TODO: verify signature if enabled, persist status change

      console.log('PawaPay deposit callback:', payload)
      return response.ok({ received: true })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @payoutCallback
   * @summary PawaPay payout callback
   * @description Handle payout callback from PawaPay
   * @tag PawaPay
   * @responseBody 200 - {"received": true}
   * @responseBody 500 - {"success": false, "error": "Payout callback failed", "details": "Unknown error"}
   */
  async payoutCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      console.log('PawaPay payout callback:', payload)
      return response.ok({ received: true })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

  /**
   * @refundCallback
   * @summary PawaPay refund callback
   * @description Handle refund callback from PawaPay
   * @tag PawaPay
   * @responseBody 200 - {"received": true}
   * @responseBody 500 - {"success": false, "error": "Refund callback failed", "details": "Unknown error"}
   */
  async refundCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      console.log('PawaPay refund callback:', payload)
      return response.ok({ received: true })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }
}
