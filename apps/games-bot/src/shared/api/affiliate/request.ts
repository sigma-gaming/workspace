import { HttpException } from '@core/exceptions'
import { env } from '../../../env'

export type ErrorType<Error> = Error
export type SuccessType<Data> = Data

export async function request<TData>(
  url: string,
  {
    method,
    params = {},
    headers = {},
    body,
  }: {
    method: string
    params?: Record<string, any>
    headers?: HeadersInit
    body?: BodyInit | null
  },
): Promise<TData> {
  const requestUrl = new URL(url, env.affiliateApi.url)

  for (const key in params) {
    if (params[key] != null) {
      requestUrl.searchParams.append(key, String(params[key]))
    }
  }

  const requestHeaders: HeadersInit = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  const response = await fetch(requestUrl, {
    method,
    headers: requestHeaders,
    body,
  })

  console.log(requestUrl.toString())
  console.log(requestHeaders)
  console.log(await response.clone().text())
  console.log(response.status)
  console.log(response.statusText)
  console.log(response.headers)

  if (!response.ok) {
    const status = response.status
    const contentType = response.headers.get('content-type')
    let payload: unknown = null

    try {
      payload = contentType?.includes('json') ? await response.json() : null
    } catch (error) {
      console.error(error)
    }

    throw new HttpException(status, payload, response)
  }

  return response.json()
}
