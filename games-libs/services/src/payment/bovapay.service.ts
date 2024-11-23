import crypto, { createHash } from 'crypto'
import { createLazyInstance, resolveOptions } from '@core/di'
import { PaymentProvider } from '@dbs/games-types'
import { BovapayOptions, BovapayOptionsToken } from '@games/options'
import axios from 'axios'
import {
  DepositRequest,
  PaymentProviderService,
  PaymentResponse,
  PaymentStatus,
  WithdrawalRequest,
} from './types'

export class BovapayService implements PaymentProviderService {
  readonly provider = PaymentProvider.Bovapay
  private readonly options: BovapayOptions

  constructor() {
    this.options = resolveOptions(BovapayOptionsToken)
  }

  private generateSignature(payload: Record<string, any>): string {
    const data = this.options.apiKey + JSON.stringify(payload)
    const hash = createHash('sha1').update(data).digest('hex')
    return hash
  }

  verifySignature = (
    payload: Record<string, any>,
    signature: string,
  ): boolean => {
    return this.generateSignature(payload) === signature
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (data) {
      headers.Signature = this.generateSignature(data)
    }

    const response = await axios({
      method,
      url: `${this.options.apiUrl}${endpoint}`,
      headers,
      data,
    })

    if (response.data.status !== 'ok') {
      throw new Error(response.data.message || 'Unknown error')
    }

    return response.data.data
  }

  private mapBovapayStatus(status: string): PaymentStatus {
    switch (status) {
      case 'paid':
        return PaymentStatus.Completed
      case 'processing':
        return PaymentStatus.Processing
      case 'waiting_payment':
        return PaymentStatus.Pending
      case 'failed':
        return PaymentStatus.Failed
      case 'timeout':
        return PaymentStatus.Timeout
      case 'rejected':
        return PaymentStatus.Rejected
      default:
        return PaymentStatus.Failed
    }
  }

  async createDeposit(request: DepositRequest): Promise<PaymentResponse> {
    const data = {
      user_uuid: request.userId,
      merchant_id: crypto.randomUUID(),
      payeer_identifier: request.userId,
      payeer_ip: request.userIp,
      payeer_type: 'trust', // TODO: Determine based on user history
      currency: request.currency.toLowerCase(),
      payment_method: request.method.toLowerCase(),
      amount: request.amount,
      callback_url: this.options.callbackUrl,
      redirect_url: request.redirectUrl,
      email: request.email,
      customer_name: request.customerName,
    }

    const response = await this.makeRequest<any>(
      'POST',
      '/merchant/v1/deposits',
      data,
    )

    return {
      transactionId: response.merchant_id,
      providerTransactionId: response.uuid,
      status: this.mapBovapayStatus(response.state),
      amount: Number(response.source_transaction.fiat_amount),
      currency: request.currency,
      formUrl: response.form_url,
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
    }
  }

  async createWithdrawal(
    _request: WithdrawalRequest,
  ): Promise<PaymentResponse> {
    // TODO: Implement withdrawal when Bovapay provides the API
    throw new Error('Withdrawals not yet supported by Bovapay')
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentStatus> {
    const response = await this.makeRequest<any>(
      'GET',
      `/v1/p2p_transactions/${transactionId}`,
    )

    return this.mapBovapayStatus(response.payload.state)
  }
}

export const bovapayService = createLazyInstance(BovapayService)
