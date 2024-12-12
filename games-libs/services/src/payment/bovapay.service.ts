import crypto from 'crypto'
import { createLazyInstance, resolveOptions } from '@core/di'
import { DepositType, PaymentProvider, PaymentStatus } from '@dbs/games-types'
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
    if (status === 'paid') return PaymentStatus.Completed
    if (status === 'processing') return PaymentStatus.Processing
    if (status === 'waiting_payment') return PaymentStatus.Pending
    if (status === 'failed') return PaymentStatus.Failed
    if (status === 'timeout') return PaymentStatus.Expired
    if (status === 'rejected') return PaymentStatus.Rejected
    return PaymentStatus.Failed
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
        type: DepositType.Redirect,
        transactionId: response.data.uuid,
        providerTransactionId: response.data.uuid,
        status: this.mapBovapayStatus(response.data.state),
        providerAmount: response.data.source_transaction.fiat_amount,
        currency: request.currency,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        payload: {
          type: DepositType.Redirect,
          redirectUrl: response.data.form_url,
        },
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
        createdAt: response.data.created_at,
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
        providerAmount: '666', // TODO: replace with actual amount
        currency: request.currency,
        createdAt: response.data.created_at,
        updatedAt: response.data.created_at,
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
