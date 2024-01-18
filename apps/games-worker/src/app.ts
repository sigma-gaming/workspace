import { TransactionType } from '@libs/games-model'
import {
  BalanceActionType,
  createQueueOutput,
  parseQueuePayload,
  Queue,
} from '@libs/games-queue-model'
import Fastify from 'fastify'
import { Connection } from 'rabbitmq-client'
import { prisma } from './shared/db'
import { env } from './shared/env'

const rmq = new Connection(env.rabbitmq.url)

rmq.on('error', (err) => {
  console.log('RabbitMQ connection error', err)
})

rmq.on('connection', () => {
  console.log('Connection successfully (re)established')
})

rmq.createConsumer(
  {
    queue: Queue.BalanceActions,
    concurrency: 1,
    qos: { prefetchCount: 100 },
    queueOptions: { durable: true },
  },
  async (message, reply) => {
    const payload = parseQueuePayload(Queue.BalanceActions, message.body)

    if (payload.type !== BalanceActionType.Deposit) {
      await reply(
        createQueueOutput(Queue.BalanceActions, {
          status: 'failure',
          reason: 'Queue type handler is not implemented',
        }),
      )

      return
    }

    const lastTransaction = await prisma.transaction.findFirst({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    })

    const lastBalance = lastTransaction?.closingBalance ?? 0

    const newTransaction = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: TransactionType.Deposit,
        amount: 10000,
        openingBalance: lastBalance,
        closingBalance: lastBalance + 10000,
      },
    })

    await reply(
      createQueueOutput(Queue.BalanceActions, {
        status: 'success',
        updatedBalance: newTransaction.closingBalance,
      }),
    )
  },
)

const server = Fastify()

server.get('/health', async (_, reply) => {
  if (!rmq.ready) {
    reply.code(503).send('Worker is not ready yet')
    return
  }

  return 'Healthy'
})

server.listen({ host: '0.0.0.0', port: env.port }).then(() => {
  console.log(`🚀 Server ready`)
})

process.on('SIGINT', async () => {
  await rmq.close()
})
