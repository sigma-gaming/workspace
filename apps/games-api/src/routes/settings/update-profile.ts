import { gamesDb } from '@games/db'
import {
  AccountProvider,
  Accounts,
  Profiles,
  ProfileUpdate,
} from '@games/db-schema'
import { getFullName, ProfileDetailed, ProfileValidation } from '@games/model'
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
      const currentProfile = await gamesDb.query.Profiles.findFirst({
        where: eq(Profiles.username, username),
      })

      if (currentProfile && currentProfile.userId !== user.id) {
        throw new BadRequestException({
          path: ['username'],
          message: 'Пользователь с таким никнеймом уже существует',
        })
      }
    }

    const accounts = await gamesDb.query.Accounts.findMany({
      where: eq(Accounts.userId, user.id),
    })

    const selectedProvider = accounts.find(
      (account) => account.provider === input.provider,
    )

    if (!selectedProvider) {
      throw new BadRequestException({
        path: ['provider'],
        message: 'Не привязан необходимый аккаунт',
      })
    }

    const updates: ProfileUpdate = {
      username: input.username ?? null,
      usedProvider: input.provider,
    }

    const nameFromProvider = getFullName(
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
      .update(Profiles)
      .set(updates)
      .where(eq(Profiles.userId, user.id))
      .returning()

    await gamesCaches.detailedProfile.del(user.id)

    return {
      status: 'success',
      detailedProfile: await profileService.getDetailedProfile(user, {
        profile,
      }),
    }
  })
