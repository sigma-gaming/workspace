import crypto from 'crypto'

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

export const request = async <T>({
  method,
  endpoint,
  data,
  config,
}: RequestParams): Promise<T> => {
  const signature = data ? generateSignature(data, config.apiKey) : ''
  const headers = {
    'Content-Type': 'application/json',
    'X-Signature': signature,
  }

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    method,
    body: JSON.stringify(data),
    headers,
  })

  const json = await response.json()

  if (!response.ok) {
    console.error('[Bovapay API] Request failed', json)
    throw json
  }

  if (json.status === 'error') {
    throw new Error('Payment provider error')
  }

  return json as T
}
