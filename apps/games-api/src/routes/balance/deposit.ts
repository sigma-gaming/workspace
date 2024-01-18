import { BadRequestException } from '@libs/exceptions'
import {
  BalanceActionType,
  createQueuePayload,
  parseQueueOutput,
  Queue,
} from '@libs/games-queue-model'
import { SessionService } from '../../services/session'
import { rmqClient } from '../../shared/rmq'
import { procedure } from '../trpc'

export const deposit = procedure.mutation(async ({ ctx }) => {
  const user = SessionService.getUser(ctx.session)

  const message = createQueuePayload(Queue.BalanceActions, {
    amount: 10000,
    userId: user.id,
    type: BalanceActionType.Deposit,
  })

  const response = await rmqClient.send(message.queueName, message.payload)

  const output = parseQueueOutput(Queue.BalanceActions, response.body)

  if (output.status === 'failure') {
    throw new BadRequestException({ message: 'Deposit failure' })
  }

  return { updatedBalance: output.updatedBalance }
})
