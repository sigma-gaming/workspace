import {
  DepositSelect,
  UserStatsSelect,
  WithdrawalSelect,
} from '@dbs/games-schema'
import {
  Currency,
  DepositMethod,
  DepositPayload,
  DepositType,
  PaymentProvider,
  PaymentStatus,
  WithdrawalMethod,
} from '@dbs/games-types'
import { ProfileDetailed } from '@games/model'

export enum PaymentOutcome {
  Success = 'Success',
  InsufficientFunds = 'InsufficientFunds',
  InvalidAmount = 'InvalidAmount',
  UnsupportedMethod = 'UnsupportedMethod',
  UnsupportedCurrency = 'UnsupportedCurrency',
  ProviderError = 'ProviderError',
  Failed = 'Failed',
}

export type DepositOutput =
  | {
      outcome: PaymentOutcome.Success
      deposit: DepositSelect
    }
  | {
      outcome: PaymentOutcome.InvalidAmount
      minAmount?: number
      maxAmount?: number
      currency: Currency
    }
  | {
      outcome: PaymentOutcome.UnsupportedMethod
      method: DepositMethod
      provider: PaymentProvider
    }
  | {
      outcome: PaymentOutcome.UnsupportedCurrency
      currency: Currency
      method: DepositMethod
    }
  | {
      outcome: PaymentOutcome.ProviderError
      error: string
    }
  | {
      outcome: PaymentOutcome.Failed
      error: string
    }

export type WithdrawalOutput =
  | {
      outcome: PaymentOutcome.Success
      withdrawal: WithdrawalSelect
    }
  | {
      outcome: PaymentOutcome.InsufficientFunds
      available: number
      currency: Currency
    }
  | {
      outcome: PaymentOutcome.InvalidAmount
      minAmount?: number
      maxAmount?: number
      currency: Currency
    }
  | {
      outcome: PaymentOutcome.UnsupportedMethod
      method: WithdrawalMethod
      provider: PaymentProvider
    }
  | {
      outcome: PaymentOutcome.UnsupportedCurrency
      currency: Currency
      method: WithdrawalMethod
    }
  | {
      outcome: PaymentOutcome.ProviderError
      error: string
    }
  | {
      outcome: PaymentOutcome.Failed
      error: string
    }

export type DepositOptions = {
  userId: string
  gemAmount: number
  provider: PaymentProvider
  method: DepositMethod
  currency: Currency
  redirectUrl: string
  userIp: string
  email?: string
  customerName?: string
}

export type WithdrawalOptions = {
  userId: string
  gemAmount: number
  provider: PaymentProvider
  method: WithdrawalMethod
  currency: Currency
  userIp: string
  email?: string
  customerName?: string
}

export type PaymentSystemConfig = {
  apiKey: string
  apiUrl: string
  userUuid: string
  callbackUrl: string
  redirectUrl: string
}

export type PaymentRequest = {
  userId: string
  userIp: string
  gemAmount: number
  currencyAmount: number
  provider: PaymentProvider
  currency: Currency
  userProfile: ProfileDetailed
  userStats: UserStatsSelect
}

export type DepositRequest = {
  method: DepositMethod
  redirectUrl: string
} & PaymentRequest

export type WithdrawalRequest = {
  method: WithdrawalMethod
} & PaymentRequest

export type PayoutRequest = {
  method: WithdrawalMethod
} & PaymentRequest

export type PaymentResponse = {
  providerTransactionId: string
  status: PaymentStatus
  providerAmount: string
  currency: Currency
  createdAt: string
  updatedAt: string
}

export type DepositResponse = PaymentResponse & {
  type: DepositType
  payload: DepositPayload
}

export type WithdrawalResponse = PaymentResponse

export type PayoutResponse = {
  transactionId: string
  status: PaymentStatus
  createdAt: string
}

export type PaymentProviderService = {
  readonly provider: PaymentProvider
  createDeposit(request: DepositRequest): Promise<DepositResponse>
  createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse>
  getTransactionStatus(transactionId: string): Promise<PaymentStatus>
}
