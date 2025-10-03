import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PawaPayService } from '#services/pawapay_service'

@inject()
export default class PawaPayController {
  constructor(private pawapay: PawaPayService) {}

  // Toolkit availability
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

  // Deposits
  async requestDeposit({ request, response }: HttpContext) {
    try {
      const body = request.only([
        'depositId',
        'amount',
        'currency',
        'country',
        'correspondent',
        'customerTimestamp',
        'statementDescription',
        'metadata',
        'payer',
        'recipient',
      ])

      if (
        !body.depositId ||
        !body.amount ||
        !body.currency ||
        !body.country ||
        !body.correspondent
      ) {
        return response.badRequest({
          success: false,
          error: 'Paramètres requis: depositId, amount, currency, country, correspondent',
        })
      }

      const result = await this.pawapay.requestDeposit(body)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

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

  // Payouts
  async requestPayout({ request, response }: HttpContext) {
    try {
      const body = request.only([
        'payoutId',
        'amount',
        'currency',
        'country',
        'correspondent',
        'recipient',
        'customerTimestamp',
        'statementDescription',
        'metadata',
      ])

      if (
        !body.payoutId ||
        !body.amount ||
        !body.currency ||
        !body.country ||
        !body.correspondent ||
        !body.recipient
      ) {
        return response.badRequest({
          success: false,
          error: 'Paramètres requis: payoutId, amount, currency, country, correspondent, recipient',
        })
      }

      const result = await this.pawapay.requestPayout(body)
      return response.ok({ success: true, data: result })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

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

  // Refunds
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

  // Callbacks (fast ack)
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

  async payoutCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      console.log('PawaPay payout callback:', payload)
      return response.ok({ received: true })
    } catch (error) {
      return response.internalServerError({ success: false, error: error.message })
    }
  }

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
