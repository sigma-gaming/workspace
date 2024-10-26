import { createSingletonProxy } from '@core/di'
import { InternalServerException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  AccountInsert,
  AccountSelect,
  AccountTable,
  BalanceTable,
  ProfileTable,
  UserSecurityTable,
  UserSelect,
  UserTable,
} from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { getUserFullName } from '@games/model'
import { gamesCaches } from '@games/redis'
import { and, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { affiliateService } from './affiliate'
import { userService } from './user'

export enum AuthResult {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
  ConnectedToAnotherUser = 'connected-to-another-user',
}

export type AuthenticatePayload = {
  userId?: string | null
  provider: AccountProvider
  providerUserId: string
  providerUsername?: string
  providerUserFirstName: string
  providerUserLastName?: string
  providerUserImage?: string
  referralCampaignCode?: string
}

type AuthenticateOutcome =
  | { result: AuthResult.SignedIn; user: UserSelect; account: AccountSelect }
  | { result: AuthResult.SignedUp; user: UserSelect; account: AccountSelect }
  | { result: AuthResult.Connected }
  | { result: AuthResult.ConnectedToAnotherUser }

@singleton()
export class AuthService {
  async authenticate({
    userId,
    provider,
    providerUserId,
    providerUsername,
    providerUserFirstName,
    providerUserLastName,
    providerUserImage,
    referralCampaignCode,
  }: AuthenticatePayload): Promise<AuthenticateOutcome> {
    const account = await gamesDb.query.AccountTable.findFirst({
      where: and(
        eq(AccountTable.provider, provider),
        eq(AccountTable.providerUserId, providerUserId),
      ),
    })

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

    if (userId) {
      if (account) {
        if (userId !== account.userId) {
          return { result: AuthResult.ConnectedToAnotherUser }
        }

        const user = await userService.getUserSafe(userId)

        if (!user) {
          const cause = new Error('User of Account not found')
          throw new InternalServerException({ cause })
        }

        return { result: AuthResult.SignedIn, user, account }
      }

      /**
       * The account is not found, but the user is logged in
       * Create account and connect it to current user
       */

      await gamesDb.insert(AccountTable).values({
        userId,
        ...accountSharedInput,
      })

      await gamesCaches.detailedProfile.del(userId)

      return { result: AuthResult.Connected }
    }

    /**
     * The user is not logged in, but the account is found
     * Sign in to the account
     */

    if (account) {
      const user = await userService.getUserSafe(account.userId)

      if (!user) {
        const cause = new Error('User of Account not found')
        throw new InternalServerException({ cause })
      }

      return { result: AuthResult.SignedIn, user, account }
    }

    /**
     * The user is not logged in and the account is not found
     * Perform registration
     */

    let referrerId: string | null | undefined
    let referralCampaignId: number | undefined

    if (referralCampaignCode) {
      const referralCampaign =
        await affiliateService.getCampaign(referralCampaignCode)

      referrerId = referralCampaign?.referrerId
      referralCampaignId = referralCampaign?.id
    }

    const { createdUser, createdAccount } = await gamesDb.transaction(
      async (tx) => {
        const [createdUser] = await tx
          .insert(UserTable)
          .values({ referrerId, referralCampaignId })
          .returning()

        const [{ id: profileId }] = await tx
          .insert(ProfileTable)
          .values({
            userId: createdUser.id,
            usedProvider: provider,
            name: getUserFullName(providerUserFirstName, providerUserLastName),
            image: providerUserImage,
          })
          .returning()

        await tx.insert(BalanceTable).values({ userId: createdUser.id })

        await tx
          .update(UserTable)
          .set({ profileId })
          .where(eq(UserTable.id, createdUser.id))

        const [createdAccount] = await tx
          .insert(AccountTable)
          .values({ userId: createdUser.id, ...accountSharedInput })
          .returning()

        await tx.insert(UserSecurityTable).values({
          userId: createdUser.id,
        })

        if (referralCampaignId) {
          await affiliateService.incrementCampaignSignups({
            tx,
            campaignId: referralCampaignId,
          })
        }

        return { createdUser, createdAccount }
      },
    )

    await gamesCaches.user.set(createdUser.id, createdUser)

    return {
      result: AuthResult.SignedUp,
      user: createdUser,
      account: createdAccount,
    }
  }
}

export const authService = createSingletonProxy(AuthService)
