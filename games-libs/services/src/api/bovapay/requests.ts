import { BovapayConfig, request } from './request'
import {
  BovapayCreateDepositRequest,
  BovapayCreateDepositResponse,
  BovapayCreatePayoutRequest,
  BovapayCreatePayoutResponse,
  BovapayTransactionStatusResponse,
} from './types'

export const createDeposit = async (
  data: BovapayCreateDepositRequest,
  config: BovapayConfig,
): Promise<BovapayCreateDepositResponse> => {
  return request<BovapayCreateDepositResponse>({
    method: 'POST',
    endpoint: '/deposits/create',
    data,
    config,
  })
}

export const getTransactionStatus = async (
  transactionId: string,
  config: BovapayConfig,
): Promise<BovapayTransactionStatusResponse> => {
  return request<BovapayTransactionStatusResponse>({
    method: 'GET',
    endpoint: `/transactions/${transactionId}/status`,
    config,
  })
}

export const createPayout = async (
  data: BovapayCreatePayoutRequest,
  config: BovapayConfig,
): Promise<BovapayCreatePayoutResponse> => {
  return request<BovapayCreatePayoutResponse>({
    method: 'POST',
    endpoint: '/payouts/create',
    data,
    config,
  })
}
