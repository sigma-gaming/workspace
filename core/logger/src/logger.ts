import { createSingletonProxy } from '@core/di'
import {
  createLogger as createNeodxLogger,
  DefaultLoggerLevel,
  Logger as NeodxLogger,
} from '@neodx/log'
import { json, pretty } from '@neodx/log/node'
import { HonoRequest } from 'hono'
import { IncomingMessage } from 'node:http'
import { inject, InjectionToken, singleton } from 'tsyringe-neo'
import { v4 as uuid } from 'uuid'

export type Logger = NeodxLogger<DefaultLoggerLevel>

export type LoggerOptions = {
  pretty?: boolean
}

export const LoggerOptionsToken: InjectionToken<LoggerOptions> =
  Symbol('LoggerOptionsToken')

@singleton()
export class LoggerService {
  logger: Logger

  constructor(@inject(LoggerOptionsToken) private options: LoggerOptions) {
    this.logger = createNeodxLogger({
      target: options.pretty ? pretty() : json(),
    })
  }

  forRequest(_req: HonoRequest) {
    if (this.options.pretty) {
      return this.logger.child('Request')
    }

    return this.logger.child('Request', {
      meta: {
        // request: {
        //   id: req.id,
        //   url: req.url,
        // },
        // user: {
        //   id: req.meta?.userId,
        //   ip: req.ip,
        //   ips: req.ips,
        // },
      },
    })
  }
}

export const loggerService = createSingletonProxy(LoggerService)

export const logger = createSingletonProxy(
  LoggerService,
  (service) => service.logger,
)

function generateReqId(req: IncomingMessage) {
  const existingID = req.headers['x-trace-id']
  if (existingID) return existingID.toString()
  const id = uuid()
  req.headers['x-trace-id'] = id
  return id
}
