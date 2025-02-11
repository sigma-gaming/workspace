export enum AccountProvider {
  VK,
  Telegram,
}

export enum UserRole {
  User,
  Admin,
  Moderator,
  Support,
}

export enum TransactionType {
  Deposit,
  Withdrawal,
  Transfer,
  Bonus,
  Bet,
  Win,
  Loss,
  Refund,
}

export enum ReferralAction {
  Deposit,
  Withdrawal,
}

export enum Game {
  Dice,
  Pincode,
}

export enum GameOutcome {
  Win,
  Loss,
}

export enum PincodeMode {
  Easy,
  Hardcore,
}

export enum NotificationKind {
  Success,
  Info,
  Warning,
  Failure,
}

export enum ChatMessageType {
  UserMessage,
  SystemMessage,
}

export enum ChatMessageAttachmentType {
  Game,
}

export enum FraudRisk {
  Clear,
  Low,
  Medium,
  High,
  Unknown,
}

export enum PromocodeBonusType {
  DepositMultiplier,
  DepositFixed,
  Payout,
}

export enum PromocodeUsageStatus {
  Applied,
  Pending,
}

export enum GlobalTaskKey {
  VkGroupSubscribe,
  VkPinnedRepost,
  TelegramGroupSubscribe,
}

export enum TaskType {
  Global,
  Personal,
}

export enum TaskStatus {
  Pending,
  Completed,
  Claimed,
}

export enum PaymentStatus {
  Pending,
  Processing,
  Completed,
  Failed,
  Rejected,
  Cancelled,
  Expired,
}

export enum Currency {
  RUB,
  KZT,
  KGS,
  UZS,
  UAH,
  USD,
  EUR,
  TRX,
  USDT_TRC20,
  USDT_ERC20,
  BTC,
  LTC,
  TON,
  NOT,
  ETH,
  BNB,
  DOGE,
}

export enum DepositType {
  Redirect,
  WhiteLabel,
}

export enum DepositMethod {
  SBP,
  CreditCard,
  Piastrix,
  Toncoin,
}

export enum WithdrawalMethod {
  SBP,
  CreditCard,
  Piastrix,
}

export enum PaymentProvider {
  Bovapay,
  Test,
}
