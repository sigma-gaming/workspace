/* eslint-disable unicorn/number-literal-case */
import { createDefer } from '@core/utils'
import { Context, Hono } from 'hono'
import {
  App,
  AppOptions,
  HttpRequest,
  HttpResponse,
  SSLApp,
} from 'uWebSockets.js'

export type UwsBindings = {
  ip: string
  req: HttpRequest
  res: HttpResponse
}

export type HonoUwsEnv = { Bindings: UwsBindings }
export type HonoUwsContext = Context<HonoUwsEnv>
export type HonoUwsApp = Hono<HonoUwsEnv>

export function createServer<E extends HonoUwsEnv>({
  origin,
  trustProxy,
  app,
  uwsOptions = {},
}: {
  origin?: string
  trustProxy?: boolean
  uwsOptions?: AppOptions
  app: Hono<E>
}) {
  let { protocol, host } = origin
    ? new URL(origin)
    : ({} as Record<string, undefined>)

  if (protocol) {
    protocol = protocol.slice(0, -1)
  }

  const isSSL = 'cert_file_name' in uwsOptions

  const uwsApp = isSSL ? SSLApp(uwsOptions) : App(uwsOptions)

  return uwsApp.any('/*', async (res, req) => {
    let aborted = false
    const abortHandlers = new Set<() => void>()

    res.onAborted(() => {
      aborted = true
      abortHandlers.forEach((handler) => handler())
    })

    const method = req.getCaseSensitiveMethod()
    const path = req.getUrl()

    let cfIP: string | null = null

    const headers = new Headers()
    req.forEach((key, value) => {
      if (key === 'cf-connecting-ip') cfIP = value
      headers.append(key, value)
    })

    function getForwardedHeader(name: string) {
      return (headers.get('x-forwarded-' + name) || '').split(',', 1)[0].trim()
    }

    protocol =
      protocol ||
      (trustProxy && getForwardedHeader('proto')) ||
      (isSSL && 'https') ||
      'http'

    host =
      host ||
      (trustProxy && getForwardedHeader('host')) ||
      headers.get('host') ||
      void 0

    if (!host) {
      console.warn(
        "Could not automatically determine the origin host, using 'localhost'. " +
          "Use the 'origin' option to set the origin explicitly.",
      )

      host = 'localhost'
    }

    const ip =
      cfIP ||
      getForwardedHeader('for') ||
      ipAddressBytesToString(res.getRemoteAddress()) ||
      ''

    const query = req.getQuery()
    const url = protocol + '://' + host + path + (query ? '?' + query : '')

    function handleError(error: unknown) {
      if (aborted) return

      console.error(error)

      res.writeStatus('500 Internal Server Error')
      res.end()
    }

    try {
      let request: Request

      if (method === 'GET' || method === 'HEAD') {
        request = new Request(url, {
          method,
          headers,
        })
      } else {
        let string = ''

        const defer = createDefer<string>()

        res.onData((chunk, isLast) => {
          string += handleArrayBuffer(chunk)
          if (isLast) defer.resolve(string)
        })

        request = new Request(url, {
          method,
          headers,
          body: await defer.promise,
        })
      }

      const responseOrPromise = app.fetch(request, {
        req,
        res,
        ip,
      })

      if (responseOrPromise instanceof Promise) {
        responseOrPromise.then(finish).catch(handleError)
      } else {
        finish(responseOrPromise).catch(handleError)
      }
    } catch (error) {
      handleError(error)
    }

    async function finish(response: Response) {
      if (aborted) return

      res.cork(() => {
        res.writeStatus(
          `${response.status}${
            response.statusText ? ' ' + response.statusText : ''
          }`,
        )

        const uniqueHeaderNames = new Set(response.headers.keys())
        for (const name of uniqueHeaderNames) {
          if (name === 'set-cookie') {
            for (const value of response.headers.getSetCookie()) {
              res.writeHeader(name, value)
            }
          } else {
            res.writeHeader(name, response.headers.get(name)!)
          }
        }

        if (!response.body) {
          res.end()
        }
      })

      if (response.body) {
        let lastChunk: Uint8Array | undefined

        for await (const chunk of response.body as any as AsyncIterable<Uint8Array>) {
          if (lastChunk) {
            // eslint-disable-next-line no-loop-func
            res.cork(() => {
              res.write(lastChunk!)
            })
          }

          lastChunk = chunk
        }

        if (lastChunk) {
          res.cork(() => {
            res.end(lastChunk!)
          })
        }
      }
    }
  })
}

// Convert 4 or 16 bytes to an IPv4 or IPv6 string
function ipAddressBytesToString(bytes: ArrayBuffer) {
  let view = new DataView(bytes)
  let result = ''
  if (
    view.byteLength === 16 &&
    view.getUint32(0) === 0 &&
    view.getUint32(4) === 0 &&
    view.getUint32(8) === 0x0000ffff
  ) {
    view = new DataView(bytes, 12)
  }

  if (view.byteLength === 4) {
    for (let i = 0; i < 4; i++) {
      result += view.getUint8(i)
      if (i < 3) result += '.'
    }
  } else if (view.byteLength === 16) {
    for (let i = 0; i < 16; i += 2) {
      result += view.getUint16(i).toString(16)
      if (i < 14) result += ':'
    }
  }
  return result
}

const decoder = new TextDecoder()

function handleArrayBuffer(message: ArrayBuffer | string) {
  if (message instanceof ArrayBuffer) {
    return decoder.decode(message)
  }

  return message
}
