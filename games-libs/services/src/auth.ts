import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  AccountInsert,
  AccountSelect,
  AccountTable,
  BalanceTable,
  ProfileTable,
  UserSecurityTable,
  UserTable,
} from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { getUserFullName, Session } from '@games/model'
import { gamesCaches } from '@games/redis'
import { and, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { affiliateService } from './affiliate'
import { Env, EnvService } from './env'

export enum AuthResult {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
  ConnectedToAnotherUser = 'connected-to-another-user',
}

type AuthenticatePayload = {
  session: Session
  provider: AccountProvider
  providerUserId: string
  providerUsername?: string
  providerUserFirstName: string
  providerUserLastName?: string
  providerUserImage?: string
  referralCampaignCode?: string
}

type AuthenticateOutput =
  | { result: AuthResult.SignedIn; account: AccountSelect }
  | { result: AuthResult.SignedUp; account: AccountSelect }
  | { result: AuthResult.Connected }
  | { result: AuthResult.ConnectedToAnotherUser }

@singleton()
export class AuthService {
  env: Env

  constructor(envService: EnvService) {
    this.env = envService.env
  }

  async authenticate({
    session: currentSession,
    provider,
    providerUserId,
    providerUsername,
    providerUserFirstName,
    providerUserLastName,
    providerUserImage,
    referralCampaignCode,
  }: AuthenticatePayload): Promise<AuthenticateOutput> {
    let account = await gamesDb.query.AccountTable.findFirst({
      where: and(
        eq(AccountTable.provider, provider),
        eq(AccountTable.providerUserId, providerUserId),
      ),
    })

    if (currentSession.user && account) {
      if (currentSession.user.id !== account.userId) {
        return { result: AuthResult.ConnectedToAnotherUser }
      }

      return { result: AuthResult.SignedIn, account }
    }

    const accountSharedInput: Omit<AccountInsert, 'userId'> = {
      provider,
      providerUserId,
      providerUsername,
      providerUserFirstName,
      providerUserLastName,
    }

    if (providerUserImage) {
      const response = await fetch(providerUserImage)

      if (response.ok) {
        accountSharedInput.providerUserImage = providerUserImage
      }
    }

    /**
     * If user is logged in and account is not found, create account and connect it to user
     */
    if (currentSession.user && !account) {
      await gamesDb.insert(AccountTable).values({
        userId: currentSession.user.id,
        ...accountSharedInput,
      })

      await gamesCaches.detailedProfile.del(currentSession.user.id)

      return { result: AuthResult.Connected }
    }

    /**
     * If user is not logged in and account is not found, perform registration
     */
    if (!account) {
      let referrerId: string | null | undefined
      let referralCampaignId: number | undefined

      if (referralCampaignCode) {
        const referralCampaign =
          await affiliateService.getCampaign(referralCampaignCode)

        referrerId = referralCampaign?.referrerId
        referralCampaignId = referralCampaign?.id
      }

      account = await gamesDb.transaction(async (tx) => {
        const [{ id: userId }] = await tx
          .insert(UserTable)
          .values({ referrerId, referralCampaignId })
          .returning()

        const [{ id: profileId }] = await tx
          .insert(ProfileTable)
          .values({
            userId,
            usedProvider: provider,
            name: getUserFullName(providerUserFirstName, providerUserLastName),
            image: providerUserImage,
          })
          .returning()

        await tx.insert(BalanceTable).values({ userId })

        await tx
          .update(UserTable)
          .set({ profileId })
          .where(eq(UserTable.id, userId))

        const [account] = await tx
          .insert(AccountTable)
          .values({ userId, ...accountSharedInput })
          .returning()

        await tx.insert(UserSecurityTable).values({
          userId,
        })

        if (referralCampaignId) {
          await affiliateService.incrementCampaignSignups({
            tx,
            campaignId: referralCampaignId,
          })
        }

        return account
      })

      return { result: AuthResult.SignedUp, account }
    }

    return { result: AuthResult.SignedIn, account }
  }
}

export const authService = createSingletonProxy(AuthService)
