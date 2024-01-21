import { createLogger } from '@neodx/log'
import { createHttpLogger } from '@neodx/log/http'
import { v4 as uuid } from 'uuid'
import { env } from '../env'

export const httpLogger = createHttpLogger({
  simple: !env.isProd,
  shouldLogRequest: true,
  getRequestId: (req) => {
    const existingID = req.headers['x-trace-id']
    if (existingID) return existingID.toString()
    const id = uuid()
    req.headers['x-trace-id'] = id
    return id
  },
})

export const logger = createLogger()
