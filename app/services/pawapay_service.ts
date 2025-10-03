import axios, { AxiosInstance } from 'axios'
import env from '#start/env'

export type PawaPayConfig = {
  baseUrl: string
  apiToken?: string
}

export class PawaPayService {
  private client: AxiosInstance
  private config: PawaPayConfig

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

  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      hasToken: !!this.config.apiToken,
      environment: this.config.baseUrl.includes('sandbox') ? 'sandbox' : 'production',
    }
  }

  async availability(country?: string) {
    // Public endpoint that reports MMO availability by country
    // Docs page is under /v1/api-reference/toolkit/availability, but the API endpoint is `/availability`.
    const params: Record<string, string> = {}
    if (country) params.country = country
    const { data } = await this.client.get('/availability', { params })
    return data
  }

  // Deposits
  async requestDeposit(payload: any) {
    // Per docs: POST /deposits
    const { data } = await this.client.post('/deposits', payload)
    return data
  }

  async checkDepositStatus(depositId: string) {
    // Check deposit status endpoint (naming per docs). If path differs, adjust here centrally.
    const { data } = await this.client.get(`/deposits/${encodeURIComponent(depositId)}`)
    return data
  }

  // Payouts
  async requestPayout(payload: any) {
    // Per docs example: POST /payouts
    const { data } = await this.client.post('/payouts', payload)
    return data
  }

  async checkPayoutStatus(payoutId: string) {
    const { data } = await this.client.get(`/payouts/${encodeURIComponent(payoutId)}`)
    return data
  }

  // Refunds
  async requestRefund(payload: any) {
    const { data } = await this.client.post('/refunds', payload)
    return data
  }

  async checkRefundStatus(refundId: string) {
    const { data } = await this.client.get(`/refunds/${encodeURIComponent(refundId)}`)
    return data
  }
}
