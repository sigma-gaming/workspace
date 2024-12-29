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
  isVerbose = process.env.NODE_ENV === 'development'
  logger: Logger

  constructor() {
    this.logger = createNeodxLogger({
      target: this.isPretty ? pretty({ serializers }) : json({ serializers }),
      level: this.isVerbose ? 'verbose' : 'done',
    })
  }
}

export const loggerService = new LoggerService()
export const logger = loggerService.logger
