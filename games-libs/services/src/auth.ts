import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  AccountInsert,
  AccountSelect,
  AccountTable,
  ProfileTable,
  UserSecurityTable,
  UserTable,
} from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { Session } from '@games/model'
import { gamesCaches } from '@games/redis'
import { and, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { Env, EnvService } from './env'
import { SessionService } from './session'
import { TelegramBotService } from './telegram-bot'

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
}

type AuthenticateOutput =
  | { result: AuthResult.SignedIn; account: AccountSelect }
  | { result: AuthResult.SignedUp; account: AccountSelect }
  | { result: AuthResult.Connected }
  | { result: AuthResult.ConnectedToAnotherUser }

@singleton()
export class AuthService {
  env: Env

  constructor(
    envService: EnvService,
    private sessionService: SessionService,
    private telegramBotService: TelegramBotService,
  ) {
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
      account = await gamesDb.transaction(async (tx) => {
        const [{ id: userId }] = await tx
          .insert(UserTable)
          .values({})
          .returning()

        const [{ id: profileId }] = await tx
          .insert(ProfileTable)
          .values({ userId, usedProvider: provider })
          .returning()

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

        return account
      })

      return { result: AuthResult.SignedUp, account }
    }

    return { result: AuthResult.SignedIn, account }
  }
}

export const authService = createSingletonProxy(AuthService)
