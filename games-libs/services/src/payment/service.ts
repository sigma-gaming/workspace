import { logger as globalLogger } from '@core/logger'
import { sleep, takeFirstOrNull, takeFirstOrThrow } from '@core/utils'
import {
  BalanceTable,
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
import { and, eq, lt, or, sql } from 'drizzle-orm'
import { balanceService } from '../balance'
import { currencyRatesService } from '../currency-rates'
import { gamesDb } from '../db'
import { notificationService } from '../notification'
import { profileService } from '../profile'
import { dayjs } from '../shared/dayjs'
import { userStatsService } from '../user-stats'
import { bovapayService } from './bovapay.service'
import {
  DEPOSIT_CONFIG_LIST,
  DEPOSIT_CONFIG_TREE,
  DEPOSIT_STALE_TIMEOUTS,
} from './deposit.config'
import {
  DepositOptions,
  DepositOutput,
  PaymentOutcome,
  PaymentProviderService,
  WithdrawalOptions,
  WithdrawalOutput,
} from './types'
import {
  WITHDRAWAL_CONFIG_LIST,
  WITHDRAWAL_STALE_TIMEOUTS,
} from './withdrawal.config'

export class PaymentService {
  private readonly logger = globalLogger.child('Payment')

  private readonly providerServices: Record<
    PaymentProvider,
    PaymentProviderService
  > = {
    [PaymentProvider.Bovapay]: bovapayService,
    [PaymentProvider.Test]: bovapayService,
  }

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
    const service = this.providerServices[provider]

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
          userProfile: await profileService.getUserDetails(userId),
          userStats: await userStatsService.getStats(userId),
        })

      try {
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
        this.logger.error('Failed to insert deposit')
        await providerService.cancelDeposit(providerTransactionId)
        throw error
      }
    } catch (error) {
      this.logger.error(error)

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

      return await gamesDb.transaction(
        async (tx): Promise<WithdrawalOutput> => {
          const balance = await tx
            .select()
            .from(BalanceTable)
            .where(eq(BalanceTable.userId, userId))
            .for('update')
            .then(takeFirstOrThrow)

          if (balance.available < gemAmount) {
            return {
              outcome: PaymentOutcome.InsufficientFunds,
              available: balance.available,
            }
          }

          const { status, providerAmount, providerTransactionId } =
            await providerService.createWithdrawal({
              userId,
              userIp,
              gemAmount,
              currencyAmount,
              method,
              currency,
              provider,
              userProfile: await profileService.getUserDetails(userId),
              userStats: await userStatsService.getStats(userId),
            })

          try {
            const transaction = await balanceService.createTransaction({
              tx,
              payload: {
                userId,
                type: TransactionType.Withdrawal,
                amount: -gemAmount,
              },
            })

            const withdrawal = await tx
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
                transactionId: transaction.id,
              })
              .returning()
              .then(takeFirstOrThrow)

            const updatedBalance = await balanceService.updateBalance({
              tx,
              balance,
              transaction,
            })

            return {
              outcome: PaymentOutcome.Success,
              withdrawal,
              updatedBalance: updatedBalance.available,
            }
          } catch (error) {
            this.logger.error('Failed to insert withdrawal')
            await providerService.cancelWithdrawal(providerTransactionId)
            throw error
          }
        },
      )
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

  async handleDepositStatusUpdate(depositId: string, newStatus: PaymentStatus) {
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
          .set({ depositCount: sql`${UserStatsTable.depositCount} + 1` })
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

  async handleWithdrawalStatusUpdate(
    withdrawalId: string,
    newStatus: PaymentStatus,
  ) {
    await gamesDb.transaction(async (tx) => {
      const withdrawal = await gamesDb
        .select()
        .from(WithdrawalTable)
        .where(eq(WithdrawalTable.id, withdrawalId))
        .for('update')
        .then(takeFirstOrNull)

      if (!withdrawal) {
        throw new Error(`Withdrawal with ID ${withdrawalId} not found`)
      }

      await tx
        .update(WithdrawalTable)
        .set({ status: newStatus })
        .where(eq(WithdrawalTable.id, withdrawalId))

      if (newStatus === PaymentStatus.Completed) {
        await tx
          .update(UserStatsTable)
          .set({ withdrawCount: sql`${UserStatsTable.withdrawCount} + 1` })
          .where(eq(UserStatsTable.userId, withdrawal.userId))

        notificationService.send({
          kind: NotificationKind.Success,
          userId: withdrawal.userId,
          title: 'Вывод произведен',
          message: `Ваша заявка на вывод ${formatGem(gemFloat(withdrawal.gemAmount))}g выполнена`,
          autoClose: true,
          autoCloseMs: 3000,
          expiresAt: dayjs().add(1, 'day').toISOString(),
          withCloseButton: true,
        })
      }

      if (
        newStatus === PaymentStatus.Failed ||
        newStatus === PaymentStatus.Expired ||
        newStatus === PaymentStatus.Rejected ||
        newStatus === PaymentStatus.Cancelled
      ) {
        const balance = await tx
          .select()
          .from(BalanceTable)
          .where(eq(BalanceTable.userId, withdrawal.userId))
          .for('update')
          .then(takeFirstOrThrow)

        const transaction = await balanceService.createTransaction({
          tx,
          payload: {
            userId: withdrawal.userId,
            type: TransactionType.Refund,
            amount: withdrawal.gemAmount,
          },
        })

        await balanceService.updateBalance({
          tx,
          balance,
          transaction,
        })
      }
    })
  }

  async processStaleDeposits() {
    for (const key of Object.keys(DEPOSIT_STALE_TIMEOUTS)) {
      const provider = Number(key) as PaymentProvider
      const providerService = this.getProviderService(provider)
      const timeout = DEPOSIT_STALE_TIMEOUTS[provider]

      const deposits = await gamesDb
        .select()
        .from(DepositTable)
        .where(
          and(
            eq(DepositTable.provider, provider),
            or(
              eq(DepositTable.status, PaymentStatus.Pending),
              eq(DepositTable.status, PaymentStatus.Processing),
            ),
            lt(
              DepositTable.createdAt,
              dayjs().subtract(timeout, 'minute').toISOString(),
            ),
          ),
        )

      for (const deposit of deposits) {
        const status = await providerService.getDepositStatus(
          deposit.providerTransactionId,
        )

        await this.handleDepositStatusUpdate(deposit.id, status)
      }
    }
  }

  async processStaleWithdrawals() {
    for (const key of Object.keys(WITHDRAWAL_STALE_TIMEOUTS)) {
      const provider = Number(key) as PaymentProvider
      const providerService = this.getProviderService(provider)
      const timeout = WITHDRAWAL_STALE_TIMEOUTS[provider]

      const withdrawals = await gamesDb
        .select()
        .from(WithdrawalTable)
        .where(
          and(
            eq(WithdrawalTable.provider, provider),
            or(
              eq(WithdrawalTable.status, PaymentStatus.Pending),
              eq(WithdrawalTable.status, PaymentStatus.Processing),
            ),
            lt(
              WithdrawalTable.createdAt,
              dayjs().subtract(timeout, 'minute').toISOString(),
            ),
          ),
        )

      for (const withdrawal of withdrawals) {
        const status = await providerService.getWithdrawalStatus(
          withdrawal.providerTransactionId,
        )

        await this.handleWithdrawalStatusUpdate(withdrawal.id, status)
      }
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
