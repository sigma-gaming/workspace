import {
  AccountProvider,
  ChatMessageType,
  FraudRisk,
  Game,
  GameOutcome,
  NotificationKind,
  TransactionType,
  UserRole,
} from '@dbs/games-types'
import { pgEnum } from 'drizzle-orm/pg-core'
import { enumValues } from './lib/enums'

/**
 * Fix quotes manually in migration file:
 * https://github.com/drizzle-team/drizzle-orm/issues/1680
 */

export const userRoleEnum = pgEnum('UserRole', enumValues(UserRole))

export const accountProviderEnum = pgEnum(
  'AccountProvider',
  enumValues(AccountProvider),
)

export const transactionTypeEnum = pgEnum(
  'TransactionType',
  enumValues(TransactionType),
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
