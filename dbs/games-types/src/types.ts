import {
  ChatMessageAttachmentType,
  DepositMethod,
  DepositType,
  Game,
  GlobalTaskKey,
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

export type SnapshotByGame<T extends Game> = {
  [Game.Dice]: GameSnapshotDice
  [Game.Pincode]: GameSnapshotPincode
}[T]

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

export type DepositInstructions = {
  method: DepositMethod.SBP
  phoneNumber: string
  providerAmount: string
  recipientName?: string
  expiresAt?: number
}

export type DepositPayload =
  | {
      type: DepositType.Redirect
      redirectUrl: string
    }
  | {
      type: DepositType.WhiteLabel
      instructions: DepositInstructions
    }
