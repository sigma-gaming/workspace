import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'

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
  accountDetails: string
} & PaymentRequest

export type PaymentResponse = {
  transactionId: string
  providerTransactionId: string
  status: PaymentStatus
  amount: number
  currency: Currency
  formUrl?: string
  createdAt: Date
  updatedAt: Date
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
  createDeposit(request: DepositRequest): Promise<PaymentResponse>
  createWithdrawal(request: WithdrawalRequest): Promise<PaymentResponse>
  getTransactionStatus(transactionId: string): Promise<PaymentStatus>
}
