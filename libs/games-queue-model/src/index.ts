import { Game } from '@libs/games-model'

export enum Queue {
  BalanceActions = 'balance_actions',
}

export enum BalanceActionType {
  Deposit = 'balance/deposit',
  Withdraw = 'balance/withdraw',
  Bet = 'balance/bet',
}

export interface GamePayload {
  kind: Game.Dice
  amount: number
  selectedSides: number[]
}

export interface QueuePayload {
  [Queue.BalanceActions]:
    | {
        type: BalanceActionType.Deposit | BalanceActionType.Withdraw
        userId: string
        amount: number
      }
    | {
        type: BalanceActionType.Bet
        userId: string
        game: GamePayload
      }
}

export interface QueueOutput {
  [Queue.BalanceActions]:
    | {
        status: 'success'
        updatedBalance: number
      }
    | {
        status: 'failure'
        reason: string
      }
}

export function createQueuePayload<T extends Queue>(
  type: T,
  payload: QueuePayload[T],
) {
  return {
    queueName: type,
    payload: Buffer.from(JSON.stringify(payload)),
  }
}

export function createQueueOutput<T extends Queue>(
  type: T,
  output: QueueOutput[T],
) {
  return Buffer.from(JSON.stringify(output))
}

export function parseQueuePayload<T extends Queue>(
  type: T,
  payload: Buffer,
): QueuePayload[T] {
  return JSON.parse(payload.toString())
}

export function parseQueueOutput<T extends Queue>(
  type: T,
  output: Buffer,
): QueueOutput[T] {
  return JSON.parse(output.toString())
}
