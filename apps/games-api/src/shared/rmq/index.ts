import { Connection } from 'rabbitmq-client'
import { env } from '../env'

const rmq = new Connection(env.rabbitmq.url)

rmq.on('error', (err) => {
  console.log('[RabbitMQ] Connection error', err)
})

rmq.on('connection', () => {
  console.log('[RabbitMQ] Connection successfully (re)established')
})

export const rmqClient = rmq.createRPCClient({ confirm: true })

process.on('SIGINT', async () => {
  await rmqClient.close()
  await rmq.close()
})
