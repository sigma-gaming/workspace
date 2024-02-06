import { createFastifyLogger, createLogger } from '@libs/logger'
import { env } from '../env'

const pretty = !env.isProd
export const logger = createLogger({ pretty })
export const fastifyLogger = createFastifyLogger({ logger, pretty })
