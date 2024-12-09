import crypto from 'crypto'
import { createLazyInstance, resolveOptions } from '@core/di'
import { PaymentProvider } from '@dbs/games-types'
import { BovapayOptions, BovapayOptionsToken } from '@games/options'
import { bovapayApi, generateSignature } from '../api/bovapay'
import {
  BovapayCreateDepositRequest,
  BovapayCreatePayoutRequest,
  BovapayStatus,
} from '../api/bovapay/types'
import {
  DepositRequest,
  DepositResponse,
  PaymentProviderService,
  PaymentStatus,
  PayoutRequest,
  PayoutResponse,
  WithdrawalRequest,
  WithdrawalResponse,
} from './types'

const encoder = new TextEncoder()

export class BovapayService implements PaymentProviderService {
  readonly provider = PaymentProvider.Bovapay
  private readonly options: BovapayOptions

  constructor() {
    this.options = resolveOptions(BovapayOptionsToken)
  }

  private mapBovapayStatus(status: BovapayStatus): PaymentStatus {
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

  verifySignature(data: Record<string, any>, signature: string): boolean {
    const expectedSignature = generateSignature(data, this.options.apiKey)

    return crypto.timingSafeEqual(
      encoder.encode(signature),
      encoder.encode(expectedSignature),
    )
  }

  async createDeposit(request: DepositRequest): Promise<DepositResponse> {
    try {
      const depositRequest: BovapayCreateDepositRequest = {
        user_uuid: request.userId,
        merchant_id: crypto.randomUUID(),
        payeer_identifier: request.userId,
        payeer_ip: request.userIp,
        payeer_type: 'trust', // TODO: Determine based on user history
        currency: request.currency.toLowerCase() as any,
        payment_method: request.method.toLowerCase() as any,
        amount: request.amount,
        callback_url: this.options.callbackUrl,
        redirect_url: request.redirectUrl,
        email: request.email,
        customer_name: request.customerName,
      }

      const response = await bovapayApi.createDeposit(depositRequest, {
        apiKey: this.options.apiKey,
        apiUrl: this.options.apiUrl,
      })

      return {
        transactionId: response.data.uuid,
        providerTransactionId: response.data.uuid,
        status: this.mapBovapayStatus(response.data.state),
        amount: Number(response.data.source_transaction.fiat_amount),
        currency: request.currency,
        redirectUrl: response.data.form_url,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      }
    } catch (error) {
      throw new Error('Failed to create deposit')
    }
  }

  async createPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      const payoutRequest: BovapayCreatePayoutRequest = {
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency.toLowerCase() as any,
        method: request.method as any,
      }

      const response = await bovapayApi.createPayout(payoutRequest, {
        apiKey: this.options.apiKey,
        apiUrl: this.options.apiUrl,
      })

      return {
        transactionId: response.data.payout_id,
        status: this.mapBovapayStatus(response.data.status),
        createdAt: new Date(response.data.created_at),
      }
    } catch (error) {
      throw new Error('Failed to create payout')
    }
  }

  async createWithdrawal(
    request: WithdrawalRequest,
  ): Promise<WithdrawalResponse> {
    try {
      const payoutRequest: BovapayCreatePayoutRequest = {
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency.toLowerCase() as any,
        method: request.method as any,
      }

      const response = await bovapayApi.createPayout(payoutRequest, {
        apiKey: this.options.apiKey,
        apiUrl: this.options.apiUrl,
      })

      return {
        transactionId: response.data.payout_id,
        providerTransactionId: response.data.payout_id,
        status: this.mapBovapayStatus(response.data.status),
        amount: request.amount,
        currency: request.currency,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.created_at),
      }
    } catch (error) {
      throw new Error('Failed to create withdrawal')
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentStatus> {
    const response = await bovapayApi.getTransactionStatus(transactionId, {
      apiKey: this.options.apiKey,
      apiUrl: this.options.apiUrl,
    })
    return this.mapBovapayStatus(response.payload.state)
  }
}

export const bovapayService = createLazyInstance(BovapayService)
