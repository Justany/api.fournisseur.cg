import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PawaPayService } from '#services/pawapay_service'
import { AppwriteService } from '#services/appwrite_service'
import { COLLECTIONS } from '#config/collections'
import { randomUUID } from 'node:crypto'

@inject()
export default class PawaPayController {
  private appwrite: AppwriteService

  constructor(private pawapay: PawaPayService) {
    // Initialiser le service Appwrite pour persister les callbacks
    this.appwrite = new AppwriteService()
  }

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
      const headers = request.headers()
      const docId = randomUUID()
      const now = new Date().toISOString()

      // Validation minimale selon le schéma PawaPay v2
      const depositId: string | undefined = payload?.depositId
      const status: string | undefined = payload?.status
      const amount: string | undefined = payload?.amount
      const currency: string | undefined = payload?.currency
      const country: string | undefined = payload?.country
      const payer: any = payload?.payer
      const customerMessage: string | undefined = payload?.customerMessage
      const created: string | undefined = payload?.created
      const providerTransactionId: string | undefined = payload?.providerTransactionId
      const failureReason: any = payload?.failureReason
      const metadata: any = payload?.metadata

      if (!depositId || !status) {
        return response.badRequest({
          success: false,
          error: 'Champs requis manquants dans le callback PawaPay',
          details: { required: ['depositId', 'status'] },
        })
      }

      // Normalisation simple du statut
      const normalizedStatus = String(status).toUpperCase() as 'COMPLETED' | 'FAILED' | 'PROCESSING'

      // Préparer les informations de sécurité si callbacks signés
      const signatureInfo = {
        signature: headers['signature'] ?? null,
        signature_input: headers['signature-input'] ?? null,
        signature_date: headers['signature-date'] ?? null,
        content_digest: headers['content-digest'] ?? null,
        accept_signature: headers['accept-signature'] ?? null,
        accept_digest: headers['accept-digest'] ?? null,
      }

      // Persister un événement enrichi avec les champs clés du callback
      await this.appwrite.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        COLLECTIONS.EVENTS,
        docId,
        {
          timestamp: now,
          user_id: '',
          installation_id: '',
          type: 'pawapay_deposit_callback',
          duration: 0,
          converted: normalizedStatus === 'COMPLETED',
          source: 'pawapay',
          conversion_goal: 'deposit',
          actions: JSON.stringify({
            path: request.url(),
            headers,
            query: request.qs(),
            payload,
            parsed: {
              depositId,
              status: normalizedStatus,
              amount,
              currency,
              country,
              payer,
              customerMessage,
              created,
              providerTransactionId,
              failureReason: failureReason ?? null,
              metadata: metadata ?? null,
            },
            security: signatureInfo,
          }),
          created_at: now,
          updated_at: now,
        }
      )

      // Enregistrer également dans la collection dédiée aux callbacks de dépôts
      try {
        await this.appwrite.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pawapay_deposit_callbacks',
          randomUUID(),
          {
            deposit_id: depositId,
            status: normalizedStatus,
            amount: amount ?? null,
            currency: currency ?? null,
            country: country ?? null,
            customer_message: customerMessage ?? null,
            provider_transaction_id: providerTransactionId ?? null,
            created_at: created ?? null,
            payer_type: payer?.type ?? null,
            payer_provider: payer?.accountDetails?.provider ?? null,
            payer_phone: payer?.accountDetails?.phoneNumber ?? null,
            failure_reason: failureReason ? JSON.stringify(failureReason) : null,
            metadata_json: metadata ? JSON.stringify(metadata) : null,
            raw_payload: JSON.stringify(payload),
            received_at: now,
            source: 'pawapay',
          }
        )
      } catch (persistErr: unknown) {
        // Ne pas bloquer l'ACK si la collection dédiée échoue
      }

      // Réponse d'accusé de réception minimaliste
      return response.ok({ received: true, id: docId, depositId, status: normalizedStatus })
    } catch (error) {
      return response.internalServerError({ success: false, error: (error as any).message })
    }
  }

  /**
   * @payoutCallback
   * @description Handle payout callback from PawaPay
   * @tag PawaPay
   * @responseBody 200 - {"received": true}
   * @responseBody 500 - {"success": false, "error": "Payout callback failed", "details": "Unknown error"}
   */
  async payoutCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      const docId = randomUUID()
      const now = new Date().toISOString()

      await this.appwrite.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        COLLECTIONS.EVENTS,
        docId,
        {
          timestamp: now,
          user_id: '',
          installation_id: '',
          type: 'pawapay_payout_callback',
          duration: 0,
          converted: false,
          source: 'pawapay',
          conversion_goal: 'payout',
          actions: JSON.stringify({
            path: request.url(),
            headers: request.headers(),
            query: request.qs(),
            payload,
          }),
          created_at: now,
          updated_at: now,
        }
      )

      // Enregistrer également dans la collection dédiée aux callbacks de paiements sortants
      try {
        const payoutId: string | undefined = payload?.payoutId
        const status: string | undefined = payload?.status
        const normalizedStatus = status ? String(status).toUpperCase() : undefined
        const amount: string | undefined = payload?.amount
        const currency: string | undefined = payload?.currency
        const country: string | undefined = payload?.country
        const recipient: any = payload?.recipient
        const customerMessage: string | undefined = payload?.customerMessage
        const created: string | undefined = payload?.created
        const providerTransactionId: string | undefined = payload?.providerTransactionId
        const failureReason: any = payload?.failureReason
        const metadata: any = payload?.metadata

        await this.appwrite.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pawapay_payout_callbacks',
          randomUUID(),
          {
            payout_id: payoutId ?? null,
            status: normalizedStatus ?? null,
            amount: amount ?? null,
            currency: currency ?? null,
            country: country ?? null,
            customer_message: customerMessage ?? null,
            provider_transaction_id: providerTransactionId ?? null,
            created_at: created ?? null,
            recipient_type: recipient?.type ?? null,
            recipient_provider: recipient?.accountDetails?.provider ?? null,
            recipient_phone:
              recipient?.accountDetails?.phoneNumber ?? recipient?.address?.value ?? null,
            failure_reason: failureReason ? JSON.stringify(failureReason) : null,
            metadata_json: metadata ? JSON.stringify(metadata) : null,
            raw_payload: JSON.stringify(payload),
            received_at: now,
            source: 'pawapay',
          }
        )
      } catch (persistErr: unknown) {
        // Ignorer les erreurs de persistence dédiée
      }

      return response.ok({ received: true, id: docId })
    } catch (error) {
      return response.internalServerError({ success: false, error: (error as any).message })
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
      const docId = randomUUID()
      const now = new Date().toISOString()

      await this.appwrite.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        COLLECTIONS.EVENTS,
        docId,
        {
          timestamp: now,
          user_id: '',
          installation_id: '',
          type: 'pawapay_refund_callback',
          duration: 0,
          converted: false,
          source: 'pawapay',
          conversion_goal: 'refund',
          actions: JSON.stringify({
            path: request.url(),
            headers: request.headers(),
            query: request.qs(),
            payload,
          }),
          created_at: now,
          updated_at: now,
        }
      )

      // Enregistrer également dans la collection dédiée aux callbacks de remboursements
      try {
        const refundId: string | undefined = payload?.refundId
        const originalDepositId: string | undefined = payload?.originalDepositId
        const status: string | undefined = payload?.status
        const normalizedStatus = status ? String(status).toUpperCase() : undefined
        const amount: string | undefined = payload?.amount
        const currency: string | undefined = payload?.currency
        const customerMessage: string | undefined = payload?.customerMessage
        const created: string | undefined = payload?.created
        const providerTransactionId: string | undefined = payload?.providerTransactionId
        const failureReason: any = payload?.failureReason
        const metadata: any = payload?.metadata

        await this.appwrite.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pawapay_payout_callbacks',
          randomUUID(),
          {
            refund_id: refundId ?? null,
            original_deposit_id: originalDepositId ?? null,
            status: normalizedStatus ?? null,
            amount: amount ?? null,
            currency: currency ?? null,
            customer_message: customerMessage ?? null,
            provider_transaction_id: providerTransactionId ?? null,
            created_at: created ?? null,
            failure_reason: failureReason ? JSON.stringify(failureReason) : null,
            metadata_json: metadata ? JSON.stringify(metadata) : null,
            raw_payload: JSON.stringify(payload),
            received_at: now,
            source: 'pawapay',
          }
        )
      } catch (persistErr) {
        // Ignorer les erreurs de persistence dédiée
      }

      return response.ok({ received: true, id: docId })
    } catch (error) {
      return response.internalServerError({ success: false, error: (error as any).message })
    }
  }
}
