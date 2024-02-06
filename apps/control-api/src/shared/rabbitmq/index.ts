import { createQueues, createRmq } from '@libs/games-queue'
import { env } from '../env'
import { logger } from '../logger'

export const rmq = createRmq(env.rabbitmq.url)
export const queues = createQueues(rmq)

export async function shutdownRabbitmq() {
  logger.info('Shutting down RabbitMQ..')
  await rmq.rpc.close()
  await rmq.connection.close()
  logger.info('RabbitMQ shutdown complete')
}
