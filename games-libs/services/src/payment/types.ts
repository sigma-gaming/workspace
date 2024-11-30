import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'

export enum PaymentResult {
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
      result: PaymentResult.Success
      transactionId: string
      redirectUrl?: string
      amount: number
      currency: Currency
    }
  | {
      result: PaymentResult.InvalidAmount
      minAmount?: number
      maxAmount?: number
      currency: Currency
    }
  | {
      result: PaymentResult.UnsupportedMethod
      method: DepositMethod
      provider: PaymentProvider
    }
  | {
      result: PaymentResult.UnsupportedCurrency
      currency: Currency
      method: DepositMethod
    }
  | {
      result: PaymentResult.ProviderError
      error: string
    }
  | {
      result: PaymentResult.Failed
      error: string
    }

export type WithdrawalOutput =
  | {
      result: PaymentResult.Success
      transactionId: string
      amount: number
      currency: Currency
    }
  | {
      result: PaymentResult.InsufficientFunds
      available: number
      currency: Currency
    }
  | {
      result: PaymentResult.InvalidAmount
      minAmount?: number
      maxAmount?: number
      currency: Currency
    }
  | {
      result: PaymentResult.UnsupportedMethod
      method: WithdrawalMethod
      provider: PaymentProvider
    }
  | {
      result: PaymentResult.UnsupportedCurrency
      currency: Currency
      method: WithdrawalMethod
    }
  | {
      result: PaymentResult.ProviderError
      error: string
    }
  | {
      result: PaymentResult.Failed
      error: string
    }

export type DepositParams = {
  userId: string
  amount: number
  provider: PaymentProvider
  method: DepositMethod
  currency: Currency
  redirectUrl: string
  userIp: string
  email?: string
  customerName?: string
}

export type WithdrawalParams = {
  userId: string
  amount: number
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
  amount: number
  provider: PaymentProvider
  currency: Currency
  userIp: string
  email?: string
  customerName?: string
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
  transactionId: string
  providerTransactionId: string
  status: PaymentStatus
  amount: number
  currency: Currency
  createdAt: Date
  updatedAt: Date
}

export type DepositResponse = {
  redirectUrl: string
} & PaymentResponse

export type WithdrawalResponse = PaymentResponse

export type PayoutResponse = {
  transactionId: string
  status: PaymentStatus
  createdAt: Date
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Timeout = 'timeout',
  Rejected = 'rejected',
}

export type PaymentProviderService = {
  readonly provider: PaymentProvider
  createDeposit(request: DepositRequest): Promise<DepositResponse>
  createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse>
  getTransactionStatus(transactionId: string): Promise<PaymentStatus>
}
