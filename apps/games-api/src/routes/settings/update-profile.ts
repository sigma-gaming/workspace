import { BadRequestException } from '@libs/exceptions'
import {
  AccountProvider,
  Accounts,
  Profiles,
  ProfileUpdate,
} from '@libs/games-db-schema'
import {
  getFullName,
  ProfileDetailed,
  ProfileValidation,
} from '@libs/games-model'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ProfileService } from '../../services/profile'
import { SessionService } from '../../services/session'
import { caches } from '../../shared/cache'
import { db } from '../../shared/db'
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
    const user = SessionService.getUser(ctx.session)
    const { username } = input

    if (username) {
      const currentProfile = await db.query.Profiles.findFirst({
        where: eq(Profiles.username, username),
      })

      if (currentProfile && currentProfile.userId !== user.id) {
        throw new BadRequestException({
          path: ['username'],
          message: 'Пользователь с таким никнеймом уже существует',
        })
      }
    }

    const accounts = await db.query.Accounts.findMany({
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

    const [profile] = await db
      .update(Profiles)
      .set(updates)
      .where(eq(Profiles.userId, user.id))
      .returning()

    await caches.detailedProfile.del(user.id)

    return {
      status: 'success',
      detailedProfile: await ProfileService.getDetailedProfile(user, {
        profile,
      }),
    }
  })
