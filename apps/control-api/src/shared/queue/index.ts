import { createQueues, createRmq } from '@libs/games-queue'
import { env } from '../env'

export const rmq = createRmq(env.rabbitmq.url)
export const queues = createQueues(rmq)
