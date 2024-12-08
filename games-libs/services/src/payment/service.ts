import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { bovapayService } from './bovapay.service'
import { DEPOSIT_CONFIG_LIST, DEPOSIT_CONFIG_TREE } from './deposit.config'
import {
  DepositOutput,
  DepositParams,
  PaymentProviderService,
  PaymentResult,
  WithdrawalOutput,
  WithdrawalParams,
} from './types'
import {
  WITHDRAWAL_CONFIG_LIST,
  WITHDRAWAL_CONFIG_TREE,
} from './withdrawal.config'

export class PaymentService {
  private providerServices: Map<PaymentProvider, PaymentProviderService> =
    new Map([[PaymentProvider.Bovapay, bovapayService]])

  getDepositConfigList() {
    return DEPOSIT_CONFIG_LIST
  }

  getWithdrawalConfigList() {
    return WITHDRAWAL_CONFIG_LIST
  }

  private getProviderService(
    provider: PaymentProvider,
  ): PaymentProviderService {
    const service = this.providerServices.get(provider)

    if (!service) {
      throw new Error(`Payment provider ${provider} not initialized`)
    }

    return service
  }

  private validateDepositBundle(
    method: DepositMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = DEPOSIT_CONFIG_TREE[method]
    if (!methodConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const currencyConfig = methodConfig[currency]
    if (!currencyConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const depositBundle = currencyConfig[provider]
    if (!depositBundle) {
      return {
        result: PaymentResult.UnsupportedCurrency,
        currency,
        method,
      } as const
    }

    return { result: PaymentResult.Success, bundle: depositBundle } as const
  }

  private validateWithdrawalBundle(
    method: WithdrawalMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = WITHDRAWAL_CONFIG_TREE[method]
    if (!methodConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const currencyConfig = methodConfig[currency]
    if (!currencyConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const withdrawalBundle = currencyConfig[provider]
    if (!withdrawalBundle) {
      return {
        result: PaymentResult.UnsupportedCurrency,
        currency,
        method,
      } as const
    }

    return { result: PaymentResult.Success, bundle: withdrawalBundle } as const
  }

  async createDeposit(params: DepositParams): Promise<DepositOutput> {
    const validation = this.validateDepositBundle(
      params.method,
      params.provider,
      params.currency,
    )

    if (validation.result !== PaymentResult.Success) {
      return validation
    }

    const { bundle } = validation

    // Validate amount
    if (bundle.minAmount && params.amount < bundle.minAmount) {
      return {
        result: PaymentResult.InvalidAmount,
        minAmount: bundle.minAmount,
        currency: params.currency,
      }
    }

    if (bundle.maxAmount && params.amount > bundle.maxAmount) {
      return {
        result: PaymentResult.InvalidAmount,
        maxAmount: bundle.maxAmount,
        currency: params.currency,
      }
    }

    try {
      const service = this.getProviderService(params.provider)
      const response = await service.createDeposit(params)

      return {
        result: PaymentResult.Success,
        transactionId: response.transactionId,
        redirectUrl: response.redirectUrl,
        amount: params.amount,
        currency: params.currency,
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          result: PaymentResult.ProviderError,
          error: error.message,
        }
      }
      return {
        result: PaymentResult.Failed,
        error: 'Unknown error occurred',
      }
    }
  }

  async createWithdrawal(params: WithdrawalParams): Promise<WithdrawalOutput> {
    try {
      const service = this.getProviderService(params.provider)
      const response = await service.createWithdrawal({
        userId: params.userId,
        amount: params.amount,
        provider: params.provider,
        method: params.method,
        currency: params.currency,
        userIp: params.userIp,
        email: params.email,
        customerName: params.customerName,
      })

      return {
        result: PaymentResult.Success,
        transactionId: response.transactionId,
        amount: response.amount,
        currency: response.currency,
      }
    } catch (error) {
      return {
        result: PaymentResult.Failed,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getTransactionStatus(provider: PaymentProvider, transactionId: string) {
    const service = this.getProviderService(provider)
    return service.getTransactionStatus(transactionId)
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
