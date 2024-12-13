import crypto from 'crypto'
import { createLazyInstance, resolveOptions } from '@core/di'
import { UserStatsSelect } from '@dbs/games-schema'
import {
  Currency,
  DepositMethod,
  DepositType,
  PaymentProvider,
  PaymentStatus,
} from '@dbs/games-types'
import { BovapayOptions, BovapayOptionsToken } from '@games/options'
import { bovapayApi, generateSignature } from '../api/bovapay'
import {
  BovapayCreateDepositRequest,
  BovapayCreatePayoutRequest,
  BovapayCurrency,
  BovapayPayeerType,
  BovapayPaymentMethod,
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

  verifySignature(data: Record<string, any>, signature: string): boolean {
    const expectedSignature = generateSignature(data, this.options.apiKey)

    return crypto.timingSafeEqual(
      encoder.encode(signature),
      encoder.encode(expectedSignature),
    )
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

  private calculatePayeerType(userStats: UserStatsSelect): BovapayPayeerType {
    if (userStats.depositCount < 3) return 'ftd'
    if (userStats.withdrawCount < 2) return 'ftd'
    return 'trust'
  }

  private mapToBovapayRequest(
    request: DepositRequest,
  ): BovapayCreateDepositRequest {
    let currency: BovapayCurrency
    let paymentMethod: BovapayPaymentMethod

    if (request.currency === Currency.RUB) {
      currency = 'rub'

      if (request.method === DepositMethod.SBP) {
        paymentMethod = 'sbp'
      } else if (request.method === DepositMethod.CreditCard) {
        paymentMethod = 'card'
      } else {
        throw new Error('Unsupported deposit method')
      }
    } else if (request.currency === Currency.KGS) {
      currency = 'kgs'

      if (request.method === DepositMethod.CreditCard) {
        paymentMethod = 'card'
      } else {
        throw new Error('Unsupported deposit method')
      }
    } else if (request.currency === Currency.UZS) {
      currency = 'uzs'

      if (request.method === DepositMethod.CreditCard) {
        paymentMethod = 'card'
      } else {
        throw new Error('Unsupported deposit method')
      }
    } else {
      throw new Error('Unsupported currency')
    }

    return {
      user_uuid: request.userId,
      merchant_id: crypto.randomUUID(),
      payeer_identifier: request.userId,
      payeer_ip: request.userIp,
      payeer_type: this.calculatePayeerType(request.userStats),
      amount: Math.ceil(request.currencyAmount),
      callback_url: this.options.callbackUrl,
      redirect_url: request.redirectUrl,
      customer_name: request.userProfile.name,
      currency,
      payment_method: paymentMethod,
    }
  }

  async createDeposit(request: DepositRequest): Promise<DepositResponse> {
    const depositRequest = this.mapToBovapayRequest(request)

    const response = await bovapayApi.createDeposit(depositRequest, {
      apiKey: this.options.apiKey,
      apiUrl: this.options.apiUrl,
    })

    return {
      type: DepositType.Redirect,
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
  }

  async createPayout(request: PayoutRequest): Promise<PayoutResponse> {
    const payoutRequest: BovapayCreatePayoutRequest = {
      user_id: request.userId,
      amount: request.currencyAmount,
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
  }

  async createWithdrawal(
    request: WithdrawalRequest,
  ): Promise<WithdrawalResponse> {
    const payoutRequest: BovapayCreatePayoutRequest = {
      user_id: request.userId,
      amount: request.currencyAmount,
      currency: request.currency.toLowerCase() as any,
      method: request.method as any,
    }

    const response = await bovapayApi.createPayout(payoutRequest, {
      apiKey: this.options.apiKey,
      apiUrl: this.options.apiUrl,
    })

    return {
      providerTransactionId: response.data.payout_id,
      status: this.mapBovapayStatus(response.data.status),
      providerAmount: '666', // TODO: replace with actual amount
      currency: request.currency,
      createdAt: response.data.created_at,
      updatedAt: response.data.created_at,
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
