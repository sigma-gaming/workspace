import {
  AccountProvider,
  ChatMessageType,
  Currency,
  DepositMethod,
  DepositType,
  FraudRisk,
  Game,
  GameOutcome,
  GlobalTaskKey,
  NotificationKind,
  PaymentProvider,
  PaymentStatus,
  PromocodeBonusType,
  PromocodeUsageStatus,
  ReferralAction,
  TaskStatus,
  TaskType,
  TransactionType,
  UserRole,
  WithdrawalMethod,
} from '@dbs/games-types'
import { DomainApp } from '@dbs/games-types-private'
import { pgEnum } from 'drizzle-orm/pg-core'
import { enumValues } from './lib/enums'

/**
 * Fix quotes manually in migration file:
 * https://github.com/drizzle-team/drizzle-orm/issues/1680
 */

export const domainAppEnum = pgEnum('DomainApp', enumValues(DomainApp))

export const userRoleEnum = pgEnum('UserRole', enumValues(UserRole))

export const accountProviderEnum = pgEnum(
  'AccountProvider',
  enumValues(AccountProvider),
)

export const transactionTypeEnum = pgEnum(
  'TransactionType',
  enumValues(TransactionType),
)

export const referralActionEnum = pgEnum(
  'ReferralAction',
  enumValues(ReferralAction),
)

export const gameEnum = pgEnum('Game', enumValues(Game))

export const gameOutcomeEnum = pgEnum('GameOutcome', enumValues(GameOutcome))

export const notificationKindEnum = pgEnum(
  'NotificationKind',
  enumValues(NotificationKind),
)

export const chatMessageTypeEnum = pgEnum(
  'ChatMessageType',
  enumValues(ChatMessageType),
)

export const fraudRiskEnum = pgEnum('FraudRisk', enumValues(FraudRisk))

export const promocodeBonusTypeEnum = pgEnum(
  'PromocodeBonusType',
  enumValues(PromocodeBonusType),
)

export const promocodeUsageStatusEnum = pgEnum(
  'PromocodeUsageStatus',
  enumValues(PromocodeUsageStatus),
)

export const taskTypeEnum = pgEnum('TaskType', enumValues(TaskType))
export const taskStatusEnum = pgEnum('TaskStatus', enumValues(TaskStatus))

export const globalTaskKeyEnum = pgEnum(
  'GlobalTaskKey',
  enumValues(GlobalTaskKey),
)

export const paymentStatusEnum = pgEnum(
  'PaymentStatus',
  enumValues(PaymentStatus),
)

export const currencyEnum = pgEnum('Currency', enumValues(Currency))

export const depositTypeEnum = pgEnum('DepositType', enumValues(DepositType))

export const depositMethodEnum = pgEnum(
  'DepositMethod',
  enumValues(DepositMethod),
)

export const withdrawalMethodEnum = pgEnum(
  'WithdrawalMethod',
  enumValues(WithdrawalMethod),
)

export const paymentProviderEnum = pgEnum(
  'PaymentProvider',
  enumValues(PaymentProvider),
)
