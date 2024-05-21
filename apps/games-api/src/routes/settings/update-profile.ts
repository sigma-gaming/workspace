import { gamesDb } from '@dbs/games-db'
import {
  AccountProvider,
  AccountTable,
  ProfileTable,
  ProfileUpdate,
} from '@dbs/games-schema'
import {
  getUserFullName,
  ProfileDetailed,
  ProfileValidation,
} from '@games/model'
import { gamesCaches } from '@games/redis'
import { profileService, sessionService } from '@games/services'
import { BadRequestException } from '@libs/exceptions'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { procedure } from '../trpc'

interface UpdateProfileOutput {
  status: 'success'
  detailedProfile: ProfileDetailed
}

export const updateProfile = procedure
  .input(
    z.object({
      username: ProfileValidation.UsernameSchema.optional(),
      name: ProfileValidation.NameSchema.optional(),
      provider: z.nativeEnum(AccountProvider),
    }),
  )
  .mutation(async ({ ctx, input }): Promise<UpdateProfileOutput> => {
    const user = sessionService.getUser(ctx.session)
    const { username } = input

    if (username) {
      const currentProfile = await gamesDb.query.ProfileTable.findFirst({
        where: eq(ProfileTable.username, username),
      })

      if (currentProfile && currentProfile.userId !== user.id)
        throw new BadRequestException({
          path: ['username'],
          message: 'Пользователь с таким никнеймом уже существует',
        })
    }

    const accounts = await gamesDb.query.AccountTable.findMany({
      where: eq(AccountTable.userId, user.id),
    })

    const selectedProvider = accounts.find(
      (account) => account.provider === input.provider,
    )

    if (!selectedProvider)
      throw new BadRequestException({
        path: ['provider'],
        message: 'Не привязан необходимый аккаунт',
      })

    const updates: ProfileUpdate = {
      username: input.username ?? null,
      usedProvider: input.provider,
    }

    const nameFromProvider = getUserFullName(
      selectedProvider.providerUserFirstName,
      selectedProvider.providerUserLastName,
    )

    if (input.name && input.name !== nameFromProvider) {
      updates.name = input.name
    }

    if (input.name === nameFromProvider) {
      updates.name = null
    }

    const [profile] = await gamesDb
      .update(ProfileTable)
      .set(updates)
      .where(eq(ProfileTable.userId, user.id))
      .returning()

    await gamesCaches.detailedProfile.del(user.id)

    return {
      status: 'success',
      detailedProfile: await profileService.getDetailedProfile(user.id, {
        user,
        profile,
      }),
    }
  })
