import { ReferrerTransactionSelect } from '@dbs/games-schema'

export type ReferrerTransactionDetailed = ReferrerTransactionSelect & {
  referralName: string | null
  referralAvatar: string | null
  referralUsername: string | null
}
