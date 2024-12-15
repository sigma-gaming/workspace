import {
  createLogger as createNeodxLogger,
  DefaultLoggerLevel,
  Logger as NeodxLogger,
} from '@neodx/log'
import { json, JsonTargetParams, pretty } from '@neodx/log/node'

export type Logger = NeodxLogger<DefaultLoggerLevel>

const serializers: JsonTargetParams['serializers'] = {
  req: (json) => json,
  res: (json) => json,
  err: (json) => json,
}

export class LoggerService {
  isPretty = process.env.NODE_ENV !== 'production'
  logger: Logger

  constructor() {
    this.logger = createNeodxLogger({
      target: this.isPretty ? pretty({ serializers }) : json({ serializers }),
    })
  }
}

export const loggerService = new LoggerService()
export const logger = loggerService.logger
