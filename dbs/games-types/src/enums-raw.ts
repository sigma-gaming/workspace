export enum AccountProvider {
  VK = 'VK',
  Telegram = 'Telegram',
}

export enum UserRole {
  User = 'User',
  Admin = 'Admin',
  Moderator = 'Moderator',
  Support = 'Support',
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
  Transfer = 'Transfer',
  Bonus = 'Bonus',
  Bet = 'Bet',
  Win = 'Win',
  Loss = 'Loss',
  Refund = 'Refund',
}

export enum ReferralAction {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
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

export enum FraudRisk {
  Clear = 'Clear',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Unknown = 'Unknown',
}

export enum PromocodeBonusType {
  DepositMultiplier = 'DepositMultiplier',
  DepositFixed = 'DepositFixed',
  Payout = 'Payout',
}

export enum PromocodeUsageStatus {
  Applied = 'Applied',
  Pending = 'Pending',
}

export enum GlobalTaskKey {
  VkGroupSubscribe = 'VkGroupSubscribe',
  VkPinnedRepost = 'VkPinnedRepost',
  TelegramGroupSubscribe = 'TelegramGroupSubscribe',
}

export enum TaskType {
  Global = 'Global',
  Personal = 'Personal',
}

export enum TaskStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Claimed = 'Claimed',
}
