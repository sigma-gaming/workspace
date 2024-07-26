import { ChatMessageAttachmentType, Game } from './enums-raw'

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
