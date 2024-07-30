import { Connection, RPCClient } from 'rabbitmq-client'

export type RMQ = {
  connection: Connection
  rpc: RPCClient
}

export function createRmq(url: string): RMQ {
  const connection = new Connection(url)

  connection.on('error', (err) => {
    console.error('[RabbitMQ] Connection error', err)
  })

  connection.on('connection', () => {
    console.info('[RabbitMQ] Connection successfully (re)established')
  })

  return {
    connection,
    rpc: connection.createRPCClient({ confirm: true }),
  }
}
