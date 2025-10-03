import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import env from '#start/env'
import { NetworkLoggerService } from '#services/network_logger_service'

export type PawaPayConfig = {
  baseUrl: string
  apiToken?: string
}

export class PawaPayService {
  private client: AxiosInstance
  private config: PawaPayConfig
  private logger: NetworkLoggerService

  constructor() {
    const baseUrl = env.get('PAWAPAY_BASE_URL', 'https://api.sandbox.pawapay.io/')
    const apiToken = env.get('PAWAPAY_API_TOKEN') as string | undefined

    if (!apiToken) {
      // We allow building without token; runtime calls will fail with clear error
      console.warn(
        'PawaPayService: PAWAPAY_API_TOKEN is not set. API calls will fail until provided.'
      )
    }

    this.config = { baseUrl: baseUrl.replace(/\/$/, '/'), apiToken }
    this.logger = new NetworkLoggerService()

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.config.apiToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.config.apiToken}`
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: defaultHeaders,
      timeout: 30000,
    })
  }

  private async send<T = any>(config: AxiosRequestConfig, service = 'pawaPay') {
    const method = (config.method || 'GET').toUpperCase()
    const url = `${this.config.baseUrl.replace(/\/$/, '')}${config.url}`
    const started = Date.now()
    try {
      this.logger.logOutgoingRequest({
        method,
        url,
        headers: (config.headers || {}) as Record<string, string>,
        body: config.data,
        service,
      })

      const res = await this.client.request<T>(config)
      const duration = Date.now() - started
      this.logger.logIncomingResponse({
        status: res.status,
        statusText: res.statusText || '',
        headers: (res.headers || {}) as Record<string, string>,
        body: res.data,
        duration,
        service,
        url,
      })
      this.logger.logRequestSuccess({ method, url, status: res.status, duration, service })
      return res.data
    } catch (e: any) {
      const duration = Date.now() - started
      const err = e?.response?.data ? new Error(JSON.stringify(e.response.data)) : e
      this.logger.logIncomingResponse({
        status: e?.response?.status || 0,
        statusText: e?.response?.statusText || 'ERROR',
        headers: (e?.response?.headers || {}) as Record<string, string>,
        body: e?.response?.data,
        duration,
        service,
        url,
      })
      this.logger.logRequestError({ error: err, method, url, service })
      throw e
    }
  }

  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      hasToken: !!this.config.apiToken,
      environment: this.config.baseUrl.includes('sandbox') ? 'sandbox' : 'production',
    }
  }

  async availability(country?: string, operationType?: 'DEPOSIT' | 'PAYOUT' | 'REFUND') {
    const params: Record<string, string> = {}
    if (country) params.country = country
    if (operationType) params.operationType = operationType
    return this.send({ method: 'GET', url: '/v2/availability', params })
  }

  // Deposits
  async requestDeposit(payload: any) {
    // v2 deposits
    return this.send({ method: 'POST', url: '/v2/deposits', data: payload })
  }

  // Check deposit status
  async checkDepositStatus(depositId: string) {
    return this.send({ method: 'GET', url: `/v2/deposits/${encodeURIComponent(depositId)}` })
  }

  // Resend deposit callback
  async resendDepositCallback(depositId: string) {
    return this.send({
      method: 'POST',
      url: `/v2/deposits/resend-callback/${encodeURIComponent(depositId)}`,
    })
  }

  // Payouts
  async requestPayout(payload: any) {
    return this.send({ method: 'POST', url: '/v2/payouts', data: payload })
  }

  // Check payout status
  async checkPayoutStatus(payoutId: string) {
    return this.send({ method: 'GET', url: `/v2/payouts/${encodeURIComponent(payoutId)}` })
  }

  // Resend payout callback
  async resendPayoutCallback(payoutId: string) {
    return this.send({
      method: 'POST',
      url: `/v2/payouts/resend-callback/${encodeURIComponent(payoutId)}`,
    })
  }

  // Refunds
  async requestRefund(payload: any) {
    return this.send({ method: 'POST', url: '/v2/refunds', data: payload })
  }

  // Check refund status
  async checkRefundStatus(refundId: string) {
    return this.send({ method: 'GET', url: `/v2/refunds/${encodeURIComponent(refundId)}` })
  }

  // Resend refund callback
  async resendRefundCallback(refundId: string) {
    return this.send({
      method: 'POST',
      url: `/v2/refunds/resend-callback/${encodeURIComponent(refundId)}`,
    })
  }

  // Payment Page (low-code flow)
  async createPaymentPage(payload: any) {
    return this.send({ method: 'POST', url: '/v2/paymentpage', data: payload })
  }

  // Wallet balances
  async walletBalances(country?: string) {
    const params: Record<string, string> = {}
    if (country) params.country = country
    return this.send({ method: 'GET', url: '/v2/wallet-balances', params })
  }

  // Active configuration
  async activeConfiguration(country?: string, operationType?: 'DEPOSIT' | 'PAYOUT') {
    const params: Record<string, string> = {}
    if (country) params.country = country
    if (operationType) params.operationType = operationType
    return this.send({ method: 'GET', url: '/v2/active-conf', params })
  }
}
