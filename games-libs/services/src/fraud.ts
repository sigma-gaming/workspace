import { createSingletonProxy } from '@core/di'
import { Logger, LoggerService } from '@core/logger'
import { HonoUwsEnv } from '@core/server'
import { gamesDb } from '@dbs/games-db'
import { UserSecuritySelect, UserSecurityTable } from '@dbs/games-schema'
import { FraudRisk } from '@dbs/games-types'
import { and, count, eq, lt } from 'drizzle-orm'
import { Context as HonoContext } from 'hono'
import { singleton } from 'tsyringe-neo'

type ActualizeRiskOptions<E extends HonoUwsEnv> = {
  ctx?: HonoContext<E>
  updateIP?: boolean
}

type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T]

type Field = KeysMatching<UserSecuritySelect, string | null>
type ScoreField = KeysMatching<UserSecuritySelect, number>

type ScoreRelation = {
  field: Field
  scoreField: ScoreField
  multiplier: number
}

const SCORE_RELATIONS: ScoreRelation[] = [
  { field: 'lastIP', scoreField: 'ipScore', multiplier: 15 },
  { field: 'addressTon', scoreField: 'addressTonScore', multiplier: 10 },
  { field: 'addressUsdt', scoreField: 'addressUsdtScore', multiplier: 10 },
  { field: 'addressUsdc', scoreField: 'addressUsdcScore', multiplier: 10 },
  { field: 'addressTrx', scoreField: 'addressTrxScore', multiplier: 10 },
  { field: 'addressEth', scoreField: 'addressEthScore', multiplier: 10 },
  { field: 'addressBtc', scoreField: 'addressBtcScore', multiplier: 10 },
  { field: 'addressLtc', scoreField: 'addressLtcScore', multiplier: 10 },
  { field: 'addressDoge', scoreField: 'addressDogeScore', multiplier: 10 },
  { field: 'addressBnb', scoreField: 'addressBnbScore', multiplier: 10 },
  { field: 'addressXmr', scoreField: 'addressXmrScore', multiplier: 10 },
  { field: 'addressSol', scoreField: 'addressSolScore', multiplier: 10 },
]

@singleton()
export class FraudService {
  private logger: Logger

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.logger.child('Fraud')
  }

  private calculateRisk(score: number): FraudRisk {
    if (score >= 75) return FraudRisk.High
    if (score >= 45) return FraudRisk.Medium
    if (score >= 30) return FraudRisk.Low
    return FraudRisk.Clear
  }

  whitelistUser = async (userId: string) => {
    await gamesDb
      .update(UserSecurityTable)
      .set({ whitelisted: true })
      .where(eq(UserSecurityTable.userId, userId))
  }

  actualizeRisk = async <E extends HonoUwsEnv>(
    userId: string,
    { ctx, updateIP = true }: ActualizeRiskOptions<E> = {},
  ): Promise<FraudRisk> => {
    try {
      const security = await gamesDb.query.UserSecurityTable.findFirst({
        where: eq(UserSecurityTable.userId, userId),
      })

      if (!security) {
        this.logger.warn(`Failed to get UserSecurity entity for user ${userId}`)
        return FraudRisk.Clear
      }

      if (security.whitelisted) {
        return FraudRisk.Clear
      }

      let lastIP = security.lastIP

      if (!lastIP || updateIP) {
        this.logger.info(`Updating IP for user ${userId}`)
        lastIP = ctx?.env.ip ?? null

        if (lastIP) {
          await gamesDb
            .update(UserSecurityTable)
            .set({ lastIP })
            .where(eq(UserSecurityTable.userId, userId))

          // eslint-disable-next-line require-atomic-updates
          security.lastIP = lastIP
        } else {
          this.logger.warn(`Failed to get IP. Probably ctx is not specified`)
        }
      }

      const updateScore = async (relation: ScoreRelation) => {
        const { field, scoreField, multiplier } = relation

        const value = security[field]

        if (!value) {
          return
        }

        const [{ count: sameCount }] = await gamesDb
          .select({ count: count() })
          .from(UserSecurityTable)
          .where(and(eq(UserSecurityTable[field], value)))

        const newScore = sameCount * multiplier

        this.logger.info(
          `Updating ${scoreField} for ${sameCount} users with the same ${field}`,
        )

        await gamesDb
          .update(UserSecurityTable)
          .set({ [scoreField]: newScore })
          .where(
            and(
              eq(UserSecurityTable[field], value),
              // Do not update if the score is already higher
              lt(UserSecurityTable[scoreField], newScore),
            ),
          )

        // eslint-disable-next-line require-atomic-updates
        security[scoreField] = newScore
      }

      for (const relation of SCORE_RELATIONS) {
        await updateScore(relation)
      }

      const totalScore = SCORE_RELATIONS.reduce(
        (acc, relation) => acc + security[relation.scoreField],
        0,
      )

      return this.calculateRisk(totalScore)
    } catch (error) {
      this.logger.error('Failed to actualize risk', error)
      return FraudRisk.Unknown
    }
  }
}

export const fraudService = createSingletonProxy(FraudService)
