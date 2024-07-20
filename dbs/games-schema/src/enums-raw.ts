export enum AccountProvider {
  VK = 'VK',
  Telegram = 'Telegram',
}

export enum UserRole {
  User = 'User',
  Admin = 'Admin',
  Moderator = 'Moderator',
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
  Bet = 'Bet',
  Win = 'Win',
  Loss = 'Loss',
}

export enum Game {
  Dice = 'Dice',
  Pincode = 'Pincode',
}

export enum GameOutcome {
  Win = 'Win',
  Loss = 'Loss',
}

export enum NotificationKind {
  Success = 'Success',
  Info = 'Info',
  Warning = 'Warning',
  Failure = 'Failure',
}

export enum ChatMessageType {
  UserMessage = 'UserMessage',
  SystemMessage = 'SystemMessage',
}

export enum ChatMessageAttachmentType {
  Game = 'Game',
}
