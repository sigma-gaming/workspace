import crypto from 'crypto'
import { loggerService } from '@core/logger'

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

const logger = loggerService.logger.child('BovapayAPI')

export const request = async <T>({
  method,
  endpoint,
  data,
  config,
}: RequestParams): Promise<T> => {
  const signature = data ? generateSignature(data, config.apiKey) : ''

  const url = `${config.apiUrl}${endpoint}`
  const body = JSON.stringify(data)

  const headers = {
    'Content-Type': 'application/json',
    'X-Signature': signature,
  }

  logger.info(`${method} ${url} ${body}`)

  const response = await fetch(url, { method, body, headers })

  const json = await response.json()

  if (!response.ok) {
    logger.error(`Request failed: ${JSON.stringify(json)}`)
    throw json
  }

  if (json.status === 'error') {
    logger.error(`Payment provider error: ${JSON.stringify(json)}`)
    throw new Error('Payment provider error')
  }

  return json as T
}
