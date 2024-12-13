import { logger } from '@core/logger'
import { sleep, takeFirstOrNull, takeFirstOrThrow } from '@core/utils'
import {
  DepositTable,
  TransactionTable,
  UserStatsTable,
  WithdrawalTable,
} from '@dbs/games-schema'
import {
  NotificationKind,
  PaymentProvider,
  PaymentStatus,
  TransactionType,
} from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { eq, sql } from 'drizzle-orm'
import { currencyRatesService } from '../currency-rates'
import { gamesDb } from '../db'
import { notificationService } from '../notification'
import { profileService } from '../profile'
import { dayjs } from '../shared/dayjs'
import { userStatsService } from '../user-stats'
import { bovapayService } from './bovapay.service'
import { DEPOSIT_CONFIG_LIST, DEPOSIT_CONFIG_TREE } from './deposit.config'
import {
  DepositOptions,
  DepositOutput,
  PaymentOutcome,
  PaymentProviderService,
  WithdrawalOptions,
  WithdrawalOutput,
} from './types'
import { WITHDRAWAL_CONFIG_LIST } from './withdrawal.config'

export class PaymentService {
  private providerServices: Map<PaymentProvider, PaymentProviderService> =
    new Map([[PaymentProvider.Bovapay, bovapayService]])

  async getDepositConfigList() {
    await sleep(500)
    return DEPOSIT_CONFIG_LIST
  }

  async getWithdrawalConfigList() {
    await sleep(500)
    return WITHDRAWAL_CONFIG_LIST
  }

  private getProviderService(
    provider: PaymentProvider,
  ): PaymentProviderService {
    const service = this.providerServices.get(provider)

    if (!service) {
      throw new Error(`Payment provider ${provider} not initialized`)
    }

    return service
  }

  async createDeposit(options: DepositOptions): Promise<DepositOutput> {
    const {
      userId,
      userIp,
      gemAmount,
      method,
      currency,
      provider,
      redirectUrl,
    } = options

    const methodConfig = DEPOSIT_CONFIG_TREE[method]

    if (!methodConfig) {
      return {
        outcome: PaymentOutcome.UnsupportedMethod,
        method,
        provider,
      }
    }

    const currencyConfig = methodConfig[currency]

    if (!currencyConfig) {
      return {
        outcome: PaymentOutcome.UnsupportedCurrency,
        method,
        currency,
      }
    }

    const config = currencyConfig[provider]

    if (!config) {
      return {
        outcome: PaymentOutcome.UnsupportedCurrency,
        currency,
        method,
      }
    }

    const { minAmount, maxAmount } = config

    if (minAmount && gemAmount < minAmount) {
      return {
        outcome: PaymentOutcome.InvalidAmount,
        minAmount,
        currency,
      }
    }

    if (maxAmount && gemAmount > maxAmount) {
      return {
        outcome: PaymentOutcome.InvalidAmount,
        maxAmount,
        currency,
      }
    }

    try {
      const providerService = this.getProviderService(provider)

      const currencyAmount = await currencyRatesService.convertGems(
        gemAmount,
        currency,
      )

      const { type, status, providerAmount, providerTransactionId, payload } =
        await providerService.createDeposit({
          userId,
          userIp,
          gemAmount,
          currencyAmount,
          method,
          currency,
          provider,
          redirectUrl,
          userProfile: await profileService.getDetailedProfile(userId),
          userStats: await userStatsService.getStats(userId),
        })

      const deposit = await gamesDb
        .insert(DepositTable)
        .values({
          type,
          status,
          userId,
          method,
          currency,
          provider,
          gemAmount,
          currencyAmount: String(currencyAmount),
          providerAmount,
          providerTransactionId,
          payload,
        })
        .returning()
        .then(takeFirstOrThrow)

      return {
        outcome: PaymentOutcome.Success,
        deposit,
      }
    } catch (error) {
      logger.error(error)

      if (error instanceof Error) {
        return {
          outcome: PaymentOutcome.ProviderError,
          error: error.message,
        }
      }

      return {
        outcome: PaymentOutcome.Failed,
        error: 'Unknown error occurred',
      }
    }
  }

  async createWithdrawal(
    options: WithdrawalOptions,
  ): Promise<WithdrawalOutput> {
    const { userId, userIp, gemAmount, provider, method, currency } = options

    try {
      const providerService = this.getProviderService(provider)

      const currencyAmount = await currencyRatesService.convertGems(
        gemAmount,
        currency,
      )

      const { status, providerAmount, providerTransactionId } =
        await providerService.createWithdrawal({
          userId,
          userIp,
          gemAmount,
          currencyAmount,
          method,
          currency,
          provider,
          userProfile: await profileService.getDetailedProfile(userId),
          userStats: await userStatsService.getStats(userId),
        })

      const withdrawal = await gamesDb
        .insert(WithdrawalTable)
        .values({
          status,
          userId,
          method,
          currency,
          provider,
          gemAmount,
          currencyAmount: String(currencyAmount),
          providerAmount,
          providerTransactionId,
        })
        .returning()
        .then(takeFirstOrThrow)

      return {
        outcome: PaymentOutcome.Success,
        withdrawal,
      }
    } catch (error) {
      return {
        outcome: PaymentOutcome.Failed,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getTransactionStatus(provider: PaymentProvider, transactionId: string) {
    const service = this.getProviderService(provider)
    return service.getTransactionStatus(transactionId)
  }

  async getDepositByProviderTransactionId(providerTransactionId: string) {
    return await gamesDb
      .select()
      .from(DepositTable)
      .where(eq(DepositTable.providerTransactionId, providerTransactionId))
      .then(takeFirstOrNull)
  }

  async handleDepositStatusUpdate(depositId: number, newStatus: PaymentStatus) {
    await gamesDb.transaction(async (tx) => {
      const deposit = await gamesDb
        .select()
        .from(DepositTable)
        .where(eq(DepositTable.id, depositId))
        .for('update')
        .then(takeFirstOrNull)

      if (!deposit) {
        throw new Error(`Deposit with ID ${depositId} not found`)
      }

      if (newStatus === PaymentStatus.Completed) {
        const transaction = await tx
          .insert(TransactionTable)
          .values({
            type: TransactionType.Deposit,
            userId: deposit.userId,
            amount: deposit.gemAmount,
          })
          .returning()
          .then(takeFirstOrThrow)

        await tx
          .update(DepositTable)
          .set({
            status: newStatus,
            transactionId: transaction.id,
          })
          .where(eq(DepositTable.id, depositId))

        await tx
          .update(UserStatsTable)
          .set({
            depositCount: sql`${UserStatsTable.depositCount} + 1`,
          })
          .where(eq(UserStatsTable.userId, deposit.userId))

        notificationService.send({
          kind: NotificationKind.Success,
          userId: deposit.userId,
          title: 'Баланс пополнен',
          message: `Ваш баланс пополнен на ${formatGem(gemFloat(deposit.gemAmount))}g`,
          autoClose: true,
          autoCloseMs: 3000,
          expiresAt: dayjs().add(1, 'day').toISOString(),
          withCloseButton: true,
        })
      } else {
        await tx
          .update(DepositTable)
          .set({ status: newStatus })
          .where(eq(DepositTable.id, depositId))
      }
    })
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
