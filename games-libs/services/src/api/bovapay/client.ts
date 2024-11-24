import crypto from 'crypto'
import axios, { AxiosError } from 'axios'
import {
  BovapayCreateDepositRequest,
  BovapayCreateDepositResponse,
  BovapayCreatePayoutRequest,
  BovapayCreatePayoutResponse,
  BovapayTransactionStatusResponse,
} from './types'

export type BovapayConfig = {
  apiKey: string
  apiUrl: string
}

type RequestParams = {
  method: 'GET' | 'POST'
  endpoint: string
  data?: Record<string, any>
  config: BovapayConfig
}

export function generateSignature(
  data: Record<string, any>,
  apiKey: string,
): string {
  const sortedKeys = Object.keys(data).sort()
  const signString = sortedKeys.map((key) => `${key}:${data[key]}`).join(';')
  return crypto.createHmac('sha256', apiKey).update(signString).digest('hex')
}

const request = async <T>({
  method,
  endpoint,
  data,
  config,
}: RequestParams): Promise<T> => {
  try {
    const signature = data ? generateSignature(data, config.apiKey) : ''
    const headers = {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    }

    const response = await axios({
      method,
      url: `${config.apiUrl}${endpoint}`,
      data,
      headers,
    })

    // Check Bovapay-specific error response
    const bovapayResponse = response.data as any
    if (bovapayResponse.status === 'error') {
      throw new Error('Payment provider error')
    }

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle HTTP errors
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      if (status === 400) {
        throw new Error(message)
      }

      // Re-throw other HTTP errors
      throw error
    }

    // Re-throw non-HTTP errors
    throw error
  }
}

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
