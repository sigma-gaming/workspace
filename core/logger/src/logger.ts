import {
  createLogger as createNeodxLogger,
  DefaultLoggerLevel,
  Logger as NeodxLogger,
} from '@neodx/log'
import { json, pretty } from '@neodx/log/node'
import { IncomingMessage } from 'node:http'
import { v4 as uuid } from 'uuid'

export type Logger = NeodxLogger<DefaultLoggerLevel>

export class LoggerService {
  logger: Logger

  constructor() {
    this.logger = createNeodxLogger({
      target: process.env.NODE_ENV === 'development' ? pretty() : json(),
    })
  }
}

export const loggerService = new LoggerService()
export const logger = loggerService.logger

function _generateReqId(req: IncomingMessage) {
  const existingID = req.headers['x-trace-id']
  if (existingID) return existingID.toString()
  const id = uuid()
  req.headers['x-trace-id'] = id
  return id
}
