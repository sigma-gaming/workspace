import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { bovapayService } from './bovapay.service'
import { DEPOSIT_CONFIG } from './deposit.config'
import { PaymentProviderService, PaymentResponse, PaymentStatus } from './types'
import { WITHDRAWAL_CONFIG } from './withdrawal.config'

export class PaymentService {
  private providerServices: Map<PaymentProvider, PaymentProviderService> =
    new Map([[PaymentProvider.Bovapay, bovapayService]])

  private getProviderService(
    provider: PaymentProvider,
  ): PaymentProviderService {
    const system = this.providerServices.get(provider)
    if (!system) {
      throw new Error(`Payment provider ${provider} not initialized`)
    }
    return system
  }

  private validateDepositMethod(
    method: DepositMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = DEPOSIT_CONFIG[method]
    if (!methodConfig) {
      throw new Error(`Deposit method ${method} is not supported`)
    }

    const providerConfig = methodConfig[provider]
    if (!providerConfig) {
      throw new Error(
        `Provider ${provider} is not supported for deposit method ${method}`,
      )
    }

    const currencyConfig = providerConfig[currency]
    if (!currencyConfig) {
      throw new Error(
        `Currency ${currency} is not supported for deposit method ${method} with provider ${provider}`,
      )
    }

    return currencyConfig
  }

  private validateWithdrawalMethod(
    method: WithdrawalMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = WITHDRAWAL_CONFIG[method]
    if (!methodConfig) {
      throw new Error(`Withdrawal method ${method} is not supported`)
    }

    const providerConfig = methodConfig[provider]
    if (!providerConfig) {
      throw new Error(
        `Provider ${provider} is not supported for withdrawal method ${method}`,
      )
    }

    const currencyConfig = providerConfig[currency]
    if (!currencyConfig) {
      throw new Error(
        `Currency ${currency} is not supported for withdrawal method ${method} with provider ${provider}`,
      )
    }

    return currencyConfig
  }

  async createDeposit(params: {
    userId: string
    method: DepositMethod
    provider: PaymentProvider
    amount: number
    currency: Currency
    redirectUrl: string
    userIp: string
    email?: string
    customerName?: string
  }): Promise<PaymentResponse> {
    const config = this.validateDepositMethod(
      params.method,
      params.provider,
      params.currency,
    )

    // Validate amount
    if (config.minAmount && params.amount < config.minAmount) {
      throw new Error(
        `Minimum deposit amount is ${config.minAmount} ${params.currency}`,
      )
    }
    if (config.maxAmount && params.amount > config.maxAmount) {
      throw new Error(
        `Maximum deposit amount is ${config.maxAmount} ${params.currency}`,
      )
    }

    const service = this.getProviderService(params.provider)
    return await service.createDeposit(params)
  }

  async createWithdrawal(params: {
    userId: string
    method: WithdrawalMethod
    provider: PaymentProvider
    amount: number
    currency: Currency
    userIp: string
    accountDetails: string
    email?: string
    customerName?: string
  }): Promise<PaymentResponse> {
    const config = this.validateWithdrawalMethod(
      params.method,
      params.provider,
      params.currency,
    )

    // Validate amount
    if (config.minAmount && params.amount < config.minAmount) {
      throw new Error(
        `Minimum withdrawal amount is ${config.minAmount} ${params.currency}`,
      )
    }
    if (config.maxAmount && params.amount > config.maxAmount) {
      throw new Error(
        `Maximum withdrawal amount is ${config.maxAmount} ${params.currency}`,
      )
    }

    const service = this.getProviderService(params.provider)
    return await service.createWithdrawal(params)
  }

  async getTransactionStatus(
    provider: PaymentProvider,
    transactionId: string,
  ): Promise<PaymentStatus> {
    const service = this.getProviderService(provider)
    return service.getTransactionStatus(transactionId)
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
