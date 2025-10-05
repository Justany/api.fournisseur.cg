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
   * @createPaymentPage
   * @summary Deposit via Payment Page
   * @description Create a PawaPay Payment Page session and get the redirectUrl
   * @tag PawaPay
   * @responseBody 201 - { "redirectUrl": "https://sandbox.paywith.pawapay.io/v2?..." }
   * @responseBody 400 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": { "failureCode": "INVALID_INPUT", "failureMessage": "We are unable to parse the body of the request. Please consult API documentation for valid request payload." }
   * }
   * @responseBody 401 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": { "failureCode": "AUTHENTICATION_ERROR", "failureMessage": "The API token in the request is invalid." }
   * }
   * @responseBody 403 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": { "failureCode": "AUTHORISATION_ERROR", "failureMessage": "The API token in the request is not authorised for this endpoint." }
   * }
   * @responseBody 500 - {
   *   "failureReason": { "failureCode": "UNKNOWN_ERROR", "failureMessage": "Unable to process request due to an unknown problem." }
   * }
   */
  async createPaymentPage({ request, response }: HttpContext) {
    try {
      const body = request.body()
      // Minimal validation following pawaPay payment page requirements
      const hasBasics =
        body?.depositId &&
        body?.returnUrl &&
        body?.amountDetails?.amount &&
        body?.amountDetails?.currency
      const hasContact = body?.phoneNumber && body?.country && body?.language
      if (!hasBasics || !hasContact) {
        return response.badRequest({
          depositId: body?.depositId ?? null,
          status: 'REJECTED',
          failureReason: {
            failureCode: 'INVALID_INPUT',
            failureMessage:
              'Requis: depositId, returnUrl, amountDetails.amount, amountDetails.currency, phoneNumber, country, language',
          },
        })
      }

      const result = await this.pawapay.createPaymentPage(body)
      // Upstream returns 201 Created with { redirectUrl }
      return response.created(result)
    } catch (error: any) {
      const status = error?.response?.status ?? 500
      const body = error?.response?.data

      if (status === 400 || status === 401 || status === 403) {
        return response.status(status).send(
          body ?? {
            depositId: request.body()?.depositId ?? null,
            status: 'REJECTED',
            failureReason: {
              failureCode:
                status === 400
                  ? 'INVALID_INPUT'
                  : status === 401
                    ? 'AUTHENTICATION_ERROR'
                    : 'AUTHORISATION_ERROR',
              failureMessage:
                status === 400
                  ? 'We are unable to parse the body of the request. Please consult API documentation for valid request payload.'
                  : status === 401
                    ? 'The API token in the request is invalid.'
                    : 'The API token in the request is not authorised for this endpoint.',
            },
          }
        )
      }

      return response.status(500).send({
        failureReason: {
          failureCode: 'UNKNOWN_ERROR',
          failureMessage: 'Unable to process request due to an unknown problem.',
        },
      })
    }
  }

  /**
   * @availability
   * @summary Availability
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
   * @summary Providers per country
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
   * @summary Active configuration
   * @description Get PawaPay active configuration for a specific country
   * @queryParam country ISO3 country code (ex: COG)
   * @queryParam operationType DEPOSIT or PAYOUT
   * @tag PawaPay
   * @responseBody 200 - {
   *   "companyName":"CONFORT 7 INC",
   * }
   * @responseBody 401 - {
   *   "failureReason": {
   *     "failureCode": "AUTHENTICATION_ERROR",
   *     "failureMessage": "The API token in the request is invalid."
   *   }
   * }
   * @responseBody 403 - {
   *   "failureReason": {
   *     "failureCode": "AUTHORISATION_ERROR",
   *     "failureMessage": "The API token in the request is not authorised for this endpoint."
   *   }
   * }
   * @responseBody 500 - {
   *   "failureReason": {
   *     "failureCode": "UNKNOWN_ERROR",
   *     "failureMessage": "Unable to process request due to an unknown problem."
   *   }
   * }
   */
  async getActiveConfiguration({ request, response }: HttpContext) {
    try {
      const { country, operationType } = request.qs()
      if (!country) {
        return response.badRequest({
          failureReason: {
            failureCode: 'VALIDATION_ERROR',
            failureMessage: 'Paramètre country requis (ISO3, ex: COG)',
          },
        })
      }

      const data = await this.pawapay.activeConfiguration(
        String(country).toUpperCase(),
        operationType ? (String(operationType).toUpperCase() as 'DEPOSIT' | 'PAYOUT') : undefined
      )

      // Return the raw PawaPay payload (no success wrapper) to match docs
      return response.ok(data)
    } catch (error: any) {
      const status = error?.response?.status ?? 500
      const body = error?.response?.data

      if (status === 401 || status === 403) {
        // Forward upstream auth/authorisation errors as-is if present
        return response.status(status).send(
          body ?? {
            failureReason: {
              failureCode: status === 401 ? 'AUTHENTICATION_ERROR' : 'AUTHORISATION_ERROR',
              failureMessage:
                status === 401
                  ? 'The API token in the request is invalid.'
                  : 'The API token in the request is not authorised for this endpoint.',
            },
          }
        )
      }

      return response.status(500).send({
        failureReason: {
          failureCode: 'UNKNOWN_ERROR',
          failureMessage: 'Unable to process request due to an unknown problem.',
        },
      })
    }
  }

  /**
   * @requestDeposit
   * @summary Request deposit
   * @description Request a deposit using PawaPay v2 payload
   * @tag PawaPay
   * @responseBody 200 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "ACCEPTED",
   *   "created": "2020-10-19T11:17:01Z"
   * }
   * @responseBody 400 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "INVALID_INPUT",
   *     "failureMessage": "We are unable to parse the body of the request. Please consult API documentation for valid request payload."
   *   }
   * }
   * @responseBody 401 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHENTICATION_ERROR",
   *     "failureMessage": "The API token in the request is invalid."
   *   }
   * }
   * @responseBody 403 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHORISATION_ERROR",
   *     "failureMessage": "The API token in the request is not authorised for this endpoint."
   *   }
   * }
   * @responseBody 500 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "failureReason": {
   *     "failureCode": "UNKNOWN_ERROR",
   *     "failureMessage": "Unable to process request due to an unknown problem."
   *   }
   * }
   */
  async requestDeposit({ request, response }: HttpContext) {
    try {
      const body = request.body()

      // Required fields aligned with Fournisseur Docs (PawaPay deposits request)
      const hasBasic = body?.depositId && body?.amount && body?.currency
      const hasPayerMMO =
        body?.payer?.type === 'MMO' &&
        !!body?.payer?.accountDetails?.provider &&
        !!body?.payer?.accountDetails?.phoneNumber
      const hasPreAuth = !!body?.preAuthorisationCode
      const hasClientRef = !!body?.clientReferenceId
      const hasCustomerMsg = !!body?.customerMessage
      const hasMetadataArray = Array.isArray(body?.metadata)

      if (
        !hasBasic ||
        !hasPayerMMO ||
        !hasPreAuth ||
        !hasClientRef ||
        !hasCustomerMsg ||
        !hasMetadataArray
      ) {
        // Return standardized 400 envelope per spec
        return response.badRequest({
          depositId: body?.depositId ?? null,
          status: 'REJECTED',
          failureReason: {
            failureCode: 'INVALID_INPUT',
            failureMessage:
              'Requis: depositId, amount, currency, payer{ type="MMO", accountDetails{ provider, phoneNumber } }, preAuthorisationCode, clientReferenceId, customerMessage, metadata[]',
          },
        })
      }

      const result = await this.pawapay.requestDeposit(body)
      // Forward upstream success body as-is (PawaPay returns 200 with status ACCEPTED)
      return response.ok(result)
    } catch (error: any) {
      const status = error?.response?.status ?? 500
      const body = error?.response?.data

      if (status === 400 || status === 401 || status === 403) {
        // Forward upstream error as-is if present
        return response.status(status).send(
          body ?? {
            depositId: request.body()?.depositId ?? null,
            status: 'REJECTED',
            failureReason: {
              failureCode:
                status === 400
                  ? 'INVALID_INPUT'
                  : status === 401
                    ? 'AUTHENTICATION_ERROR'
                    : 'AUTHORISATION_ERROR',
              failureMessage:
                status === 400
                  ? 'We are unable to parse the body of the request. Please consult API documentation for valid request payload.'
                  : status === 401
                    ? 'The API token in the request is invalid.'
                    : 'The API token in the request is not authorised for this endpoint.',
            },
          }
        )
      }

      return response.status(500).send({
        depositId: request.body()?.depositId ?? null,
        failureReason: {
          failureCode: 'UNKNOWN_ERROR',
          failureMessage: 'Unable to process request due to an unknown problem.',
        },
      })
    }
  }

  /**
   * @checkDepositStatus
   * @summary Check deposit status
   * @description Get the current status of a deposit using pawaPay v2
   * @tag PawaPay
   * @responseBody 200 - {
   *   "status": "FOUND",
   *   "data": {
   *     "depositId": "8917c345-4791-4285-a416-62f24b6982db",
   *     "status": "COMPLETED",
   *     "amount": "123.00",
   *     "currency": "ZMW",
   *     "country": "ZMB",
   *     "payer": {
   *       "type": "MMO",
   *       "accountDetails": { "phoneNUmber": "260763456789", "provider": "MTN_MOMO_ZMB" }
   *     },
   *     "customerMessage": "To ACME company",
   *     "clientReferenceId": "REF-987654321",
   *     "created": "2020-10-19T08:17:01Z",
   *     "providerTransactionId": "12356789",
   *     "metadata": { "orderId": "ORD-123456789", "customerId": "customer@email.com" }
   *   }
   * }
   * @responseBody 401 - {
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHENTICATION_ERROR",
   *     "failureMessage": "The API token in the request is invalid."
   *   }
   * }
   * @responseBody 403 - {
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHORISATION_ERROR",
   *     "failureMessage": "The API token in the request is not authorised for this endpoint."
   *   }
   * }
   * @responseBody 500 - {
   *   "failureReason": {
   *     "failureCode": "UNKNOWN_ERROR",
   *     "failureMessage": "Unable to process request due to an unknown problem."
   *   }
   * }
   */
  async checkDepositStatus({ params, response }: HttpContext) {
    try {
      const { depositId } = params
      if (!depositId) {
        return response.badRequest({
          failureReason: {
            failureCode: 'VALIDATION_ERROR',
            failureMessage: 'depositId requis',
          },
        })
      }
      const result = await this.pawapay.checkDepositStatus(depositId)
      // Forward upstream body as-is (e.g., { status: 'FOUND' | 'NOT_FOUND', data?: {...} })
      return response.ok(result)
    } catch (error: any) {
      const status = error?.response?.status ?? 500
      const body = error?.response?.data

      if (status === 401 || status === 403) {
        return response.status(status).send(
          body ?? {
            status: 'REJECTED',
            failureReason: {
              failureCode: status === 401 ? 'AUTHENTICATION_ERROR' : 'AUTHORISATION_ERROR',
              failureMessage:
                status === 401
                  ? 'The API token in the request is invalid.'
                  : 'The API token in the request is not authorised for this endpoint.',
            },
          }
        )
      }

      return response.status(500).send({
        failureReason: {
          failureCode: 'UNKNOWN_ERROR',
          failureMessage: 'Unable to process request due to an unknown problem.',
        },
      })
    }
  }

  /**
   * @requestPayout
   * @summary Request payout
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
   * @summary Check payout status
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
   * @summary Request refund
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
   * @summary Check refund status
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
   * @summary Deposit callback
   * @description Handle deposit callback from PawaPay
   * @tag PawaPay
   * @responseBody 200 - {"received": true, "id": docId, "depositId": depositId, "status": "COMPLETED" | "FAILED" | "PROCESSING"}
   * @responseBody 500 - {"success": false, "error": "Deposit callback failed", "details": "Unknown error"}
   */
  async depositCallback({ request, response }: HttpContext) {
    try {
      const payload = request.body()
      // const headers = request.headers()
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
      const clientReferenceId: string | undefined = payload?.clientReferenceId
      const created: string | undefined = payload?.created
      const providerTransactionId: string | undefined = payload?.providerTransactionId
      const failureReason: any = payload?.failureReason
      const metadata: any = payload?.metadata

      // Conformité stricte aux champs requis de la spec callback
      const missing: string[] = []
      if (!depositId) missing.push('depositId')
      if (!status) missing.push('status')
      if (!amount) missing.push('amount')
      if (!currency) missing.push('currency')
      if (!country) missing.push('country')
      if (!payer?.type) missing.push('payer.type')
      if (!payer?.accountDetails?.provider) missing.push('payer.accountDetails.provider')
      if (!payer?.accountDetails?.phoneNumber) missing.push('payer.accountDetails.phoneNumber')
      if (!customerMessage) missing.push('customerMessage')
      if (!created) missing.push('created')
      if (!providerTransactionId) missing.push('providerTransactionId')
      if (!metadata) missing.push('metadata')

      if (missing.length) {
        return response.badRequest({
          success: false,
          error: 'Champs requis manquants dans le callback PawaPay',
          details: { required: missing },
        })
      }

      // Normalisation simple du statut
      const normalizedStatus = String(status).toUpperCase() as 'COMPLETED' | 'FAILED' | 'PROCESSING'

      // Préparer les informations de sécurité si callbacks signés
      // const signatureInfo = {
      //   signature: headers['signature'] ?? null,
      //   signature_input: headers['signature-input'] ?? null,
      //   signature_date: headers['signature-date'] ?? null,
      //   content_digest: headers['content-digest'] ?? null,
      //   accept_signature: headers['accept-signature'] ?? null,
      //   accept_digest: headers['accept-digest'] ?? null,
      // }

      // Enregistrer également dans la collection dédiée aux callbacks de dépôts
      try {
        await this.appwrite.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          COLLECTIONS.PAWA_PAY_DEPOSIT_CALLBACKS,
          randomUUID(),
          {
            deposit_id: depositId,
            status: normalizedStatus,
            amount: amount ?? null,
            currency: currency ?? null,
            country: country ?? null,
            customer_message: customerMessage ?? null,
            client_reference_id: clientReferenceId ?? null,
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
   * @resendDepositCallback
   * @summary Resend deposit callback
   * @description Resend the callback for a deposit to your configured callback URL. Deposit must be in a final state.
   * @tag PawaPay
   * @responseBody 200 - {
   *   "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
   *   "status": "ACCEPTED"
   * }
   * @responseBody 401 - {
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHENTICATION_ERROR",
   *     "failureMessage": "The API token in the request is invalid."
   *   }
   * }
   * @responseBody 403 - {
   *   "status": "REJECTED",
   *   "failureReason": {
   *     "failureCode": "AUTHORISATION_ERROR",
   *     "failureMessage": "The API token in the request is not authorised for this endpoint."
   *   }
   * }
   * @responseBody 500 - {
   *   "failureReason": {
   *     "failureCode": "UNKNOWN_ERROR",
   *     "failureMessage": "Unable to process request due to an unknown problem."
   *   }
   * }
   */
  async resendDepositCallback({ params, response }: HttpContext) {
    try {
      const { depositId } = params
      if (!depositId) {
        return response.badRequest({
          failureReason: {
            failureCode: 'VALIDATION_ERROR',
            failureMessage: 'depositId requis',
          },
        })
      }

      const result = await this.pawapay.resendDepositCallback(depositId)
      // Forward upstream body as-is (e.g., { depositId, status: 'ACCEPTED' | 'REJECTED', failureReason? })
      return response.ok(result)
    } catch (error: any) {
      const status = error?.response?.status ?? 500
      const body = error?.response?.data

      if (status === 401 || status === 403) {
        return response.status(status).send(
          body ?? {
            status: 'REJECTED',
            failureReason: {
              failureCode: status === 401 ? 'AUTHENTICATION_ERROR' : 'AUTHORISATION_ERROR',
              failureMessage:
                status === 401
                  ? 'The API token in the request is invalid.'
                  : 'The API token in the request is not authorised for this endpoint.',
            },
          }
        )
      }

      return response.status(500).send({
        failureReason: {
          failureCode: 'UNKNOWN_ERROR',
          failureMessage: 'Unable to process request due to an unknown problem.',
        },
      })
    }
  }

  /**
   * @payoutCallback
   * @description Payout callback from PawaPay
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
   * @summary Refund callback
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
