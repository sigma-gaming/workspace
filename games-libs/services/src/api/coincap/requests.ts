import { request } from './request'
import { GetRatesOutput } from './types'

export const getRates = async (): Promise<GetRatesOutput> => {
  return request<GetRatesOutput>({
    method: 'GET',
    endpoint: '/rates',
  })
}
