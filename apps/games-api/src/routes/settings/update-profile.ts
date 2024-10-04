import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { gamesDb } from '@dbs/games-db'
import { AccountTable, ProfileTable, ProfileUpdate } from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { getUserFullName, ProfileValidation } from '@games/model'
import { gamesCaches } from '@games/redis'
import { profileService, sessionService } from '@games/services'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const updateProfileRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      username: ProfileValidation.UsernameSchema.optional(),
      name: ProfileValidation.NameSchema.optional(),
      provider: z.nativeEnum(AccountProvider),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const session = ctx.get('session')
    const user = sessionService.getUser(session)

    if (payload.username) {
      const currentProfile = await gamesDb.query.ProfileTable.findFirst({
        where: eq(ProfileTable.username, payload.username),
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
      (account) => account.provider === payload.provider,
    )

    if (!selectedProvider)
      throw new BadRequestException({
        path: ['provider'],
        message: 'Не привязан необходимый аккаунт',
      })

    const updates: ProfileUpdate = {
      username: payload.username ?? null,
      usedProvider: payload.provider,
      image: selectedProvider.providerUserImage,
    }

    const nameFromProvider = getUserFullName(
      selectedProvider.providerUserFirstName,
      selectedProvider.providerUserLastName,
    )

    if (payload.name) {
      updates.name = payload.name
      updates.hasCustomName = payload.name !== nameFromProvider
    } else {
      updates.name = nameFromProvider
      updates.hasCustomName = false
    }

    const [profile] = await gamesDb
      .update(ProfileTable)
      .set(updates)
      .where(eq(ProfileTable.userId, user.id))
      .returning()

    await gamesCaches.detailedProfile.del(user.id)

    return ctx.json({
      status: 'success',
      detailedProfile: await profileService.getDetailedProfile(user.id, {
        user,
        profile,
      }),
    })
  },
)
