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

export enum PaymentStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}

export enum Currency {
  RUB = 'RUB',
  KZT = 'KZT',
  KGS = 'KGS',
  UZS = 'UZS',
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
  TRX = 'TRX',
  USDT_TRC20 = 'USDT_TRC20',
  USDT_ERC20 = 'USDT_ERC20',
  BTC = 'BTC',
  LTC = 'LTC',
  TON = 'TON',
  NOT = 'NOT',
  ETH = 'ETH',
  BNB = 'BNB',
  DOGE = 'DOGE',
}

export enum DepositMethod {
  SBP = 'SBP',
  CreditCard = 'CreditCard',
  Piastrix = 'Piastrix',
  Toncoin = 'Toncoin',
}

export enum WithdrawalMethod {
  SBP = 'SBP',
  CreditCard = 'CreditCard',
  Piastrix = 'Piastrix',
}

export enum PaymentProvider {
  Bovapay = 'Bovapay',
  Test = 'Test',
}
