import { Consumer, ConsumerProps, ConsumerStatus } from 'rabbitmq-client'
import { RMQ } from './rmq'

type Options = {
  name: string
}

export type Queue<TPayload, TOutput> = {
  send(payload: TPayload): Promise<TOutput>
  createConsumer(
    options: Omit<ConsumerProps, 'queue'> & {
      handler: (
        payload: TPayload,
      ) =>
        | TOutput
        | Promise<TOutput>
        | ConsumerStatus.DROP
        | ConsumerStatus.REQUEUE
        | Promise<ConsumerStatus.DROP>
        | Promise<ConsumerStatus.REQUEUE>
    },
  ): Consumer
}

export function createQueue<TPayload, TOutput>(
  rmq: RMQ,
  { name: queueName }: Options,
): Queue<TPayload, TOutput> {
  return {
    send: async (payload) => {
      const response = await rmq.rpc.send(
        queueName,
        Buffer.from(JSON.stringify(payload)),
      )

      return JSON.parse(response.body.toString())
    },
    createConsumer: ({ handler, ...options }) => {
      return rmq.connection.createConsumer(
        {
          ...options,
          queue: queueName,
        },
        async (message, reply) => {
          const payload = JSON.parse(message.body.toString())

          const output = await handler(payload)

          if (output === ConsumerStatus.DROP) {
            return ConsumerStatus.DROP
          }

          if (output === ConsumerStatus.REQUEUE) {
            return ConsumerStatus.REQUEUE
          }

          reply(output)
        },
      )
    },
  }
}
