type RequestParams = {
  method: 'GET'
  endpoint: string
  query?: Record<string, any>
}

export const request = async <T>({
  method,
  endpoint,
  query,
}: RequestParams): Promise<T> => {
  let url = `https://data-api.binance.vision/api${endpoint}`

  const queryString = new URLSearchParams(query).toString()

  if (queryString) {
    url += `?${queryString}`
  }

  const response = await fetch(url, { method })

  const json = await response.json()

  if (!response.ok) {
    console.error('[Binance API] Request failed', json)
    throw json
  }

  return json as T
}
