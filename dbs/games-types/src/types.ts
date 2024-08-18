import {
  ChatMessageAttachmentType,
  Game,
  PromocodeBonusType,
} from './enums-raw'

export type GameSnapshotDice = {
  game: Game.Dice
  inputSides: number[]
  outputSide: number
}

export type GameSnapshotPincode = {
  game: Game.Pincode
  outputNumber: number
}

export type GameSnapshot = GameSnapshotDice | GameSnapshotPincode

export type ChatMessageAttachmentGame = {
  type: ChatMessageAttachmentType.Game
  transactionId: string
}

export type ChatMessageAttachment = ChatMessageAttachmentGame

export type PromocodeBonus =
  | {
      type: PromocodeBonusType.DepositMultiplier
      multiplier: number
      minDeposit?: number
      maxPayout?: number
      activeHours: number
    }
  | {
      type: PromocodeBonusType.DepositFixed
      payout: number
      minDeposit: number
      activeHours: number
    }
  | {
      type: PromocodeBonusType.Payout
      payout: number
    }
