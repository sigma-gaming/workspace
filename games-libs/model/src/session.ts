import { SessionSelect, UserSelect } from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'

export enum SessionState {
  Empty,
  Expired,
  Authenticated,
}

export type AccessTokenPayload = {
  userId: string
  referrerId: string | null
  referralCampaignId: number | null
  provider: AccountProvider
}

export type SessionTokenPayload = {
  userId: string
  referrerId: string | null
  referralCampaignId: number | null
  provider: AccountProvider
}

export type SessionVariant =
  | { state: SessionState.Authenticated; session: SessionSelect }
  | { state: SessionState.Empty; session: null }
  | { state: SessionState.Expired; session: null }

export type SessionDetailed =
  | {
      state: SessionState.Authenticated
      user: UserSelect
      token: string
      expiresAt: string
      provider: AccountProvider
    }
  | { state: SessionState.Expired; user: null; token: string }
  | { state: SessionState.Empty; user: null; token?: string }
