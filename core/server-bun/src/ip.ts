import { getIpFromProxy } from '@core/server'
import { Context } from 'hono'
import { getConnInfo } from 'hono/bun'

export function getIpFromBun(ctx: Context) {
  const fromProxy = getIpFromProxy(ctx)
  if (fromProxy) return fromProxy
  const connInfo = getConnInfo(ctx)
  const ip = connInfo.remote.address
  if (!ip) throw new Error('Failed to get IP from Bun')
  return ip
}
