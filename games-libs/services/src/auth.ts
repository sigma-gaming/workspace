import { InternalServerException } from '@core/exceptions'
import { takeFirstOrThrow } from '@core/utils'
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
import { gamesDb } from '@games/services'
import { and, eq } from 'drizzle-orm'
import { affiliateService } from './affiliate'
import { gamesCache } from './cache'
import { userService } from './user'

export enum AuthOutcome {
  SignedIn = 'signed-in',
  SignedUp = 'signed-up',
  Connected = 'connected',
  ConnectedToAnotherUser = 'connected-to-another-user',
  AnotherAccountConnected = 'another-account-connected',
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
  virtual?: boolean
}

type AuthenticateOutput =
  | { outcome: AuthOutcome.SignedIn; user: UserSelect; account: AccountSelect }
  | { outcome: AuthOutcome.SignedUp; user: UserSelect; account: AccountSelect }
  | { outcome: AuthOutcome.Connected }
  | { outcome: AuthOutcome.ConnectedToAnotherUser }
  | { outcome: AuthOutcome.AnotherAccountConnected }

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
    virtual,
  }: AuthenticatePayload): Promise<AuthenticateOutput> {
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
      const connectedAccount = await gamesDb.query.AccountTable.findFirst({
        where: and(
          eq(AccountTable.userId, userId),
          eq(AccountTable.provider, provider),
        ),
      })

      if (
        connectedAccount &&
        connectedAccount.providerUserId !== providerUserId
      ) {
        return { outcome: AuthOutcome.AnotherAccountConnected }
      }

      if (account) {
        /**
         * Account is already connected, but to another user
         */
        if (userId !== account.userId) {
          return { outcome: AuthOutcome.ConnectedToAnotherUser }
        }

        /**
         * Account is already connected to current user
         * Just do sign in
         */

        const user = await userService.getUserSafe(userId)

        if (!user) {
          const cause = new Error('User of Account not found')
          throw new InternalServerException({ cause })
        }

        return { outcome: AuthOutcome.SignedIn, user, account }
      }

      /**
       * The account is not found, and the user is logged in
       * Create account and connect it to current user
       */

      await gamesDb.insert(AccountTable).values({
        userId,
        ...accountSharedInput,
      })

      await gamesCache.detailedProfile.del(userId)

      return { outcome: AuthOutcome.Connected }
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

      return { outcome: AuthOutcome.SignedIn, user, account }
    }

    /**
     * The user is not logged in and the account is not found
     * Perform sign up
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
        const createdUser = await tx
          .insert(UserTable)
          .values({ referrerId, referralCampaignId, virtual })
          .returning()
          .then(takeFirstOrThrow)

        const { id: profileId } = await tx
          .insert(ProfileTable)
          .values({
            userId: createdUser.id,
            usedProvider: provider,
            name: getUserFullName(providerUserFirstName, providerUserLastName),
            image: providerUserImage,
          })
          .returning()
          .then(takeFirstOrThrow)

        await tx.insert(BalanceTable).values({ userId: createdUser.id })

        await tx
          .update(UserTable)
          .set({ profileId })
          .where(eq(UserTable.id, createdUser.id))

        const createdAccount = await tx
          .insert(AccountTable)
          .values({ userId: createdUser.id, ...accountSharedInput })
          .returning()
          .then(takeFirstOrThrow)

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

    await gamesCache.user.set(createdUser.id, createdUser)

    return {
      outcome: AuthOutcome.SignedUp,
      user: createdUser,
      account: createdAccount,
    }
  }
}

export const authService = new AuthService()
