import {
  ChatMessageAttachmentType,
  DepositMethod,
  Game,
  GlobalTaskKey,
  PromocodeBonusType,
  WithdrawalMethod,
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
  gameRecordId: number
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

export type GlobalTaskRequirements =
  | {
      type: GlobalTaskKey.TelegramGroupSubscribe
      groupHandle: string
      groupId: number
    }
  | {
      type: GlobalTaskKey.VkGroupSubscribe
      groupHandle: string
      groupId: number
    }
  | {
      type: GlobalTaskKey.VkPinnedRepost
      groupHandle: string
      groupId: number
      postId: number
    }

export type DepositProviderPayload = {
  method: DepositMethod.SBP
  example: string
}

export type WithdrawalProviderPayload = {
  method: WithdrawalMethod.SBP
  example: string
}
