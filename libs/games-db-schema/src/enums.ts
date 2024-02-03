import { pgEnum } from 'drizzle-orm/pg-core'
import { AccountProvider, Game, TransactionType, UserRole } from './enums-raw'
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
