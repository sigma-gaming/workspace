import { BadRequestException } from '@libs/exceptions'
import { Prisma } from '@libs/games-db'
import {
  AccountProvider,
  getFullName,
  ProfileDetailed,
  ProfileValidation,
} from '@libs/games-model'
import { z } from 'zod'
import { detailedProfileCache } from '../../caches/profile'
import { ProfileService } from '../../services/profile'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
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

    if (input.username) {
      const existingUser = await prisma.profile.findFirst({
        where: { username: input.username },
      })

      if (existingUser && existingUser.userId !== user.id) {
        throw new BadRequestException({
          path: ['username'],
          message: 'Пользователь с таким никнеймом уже существует',
        })
      }
    }

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
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

    const data: Prisma.ProfileUpdateInput = {
      username: input.username ?? null,
      usedProvider: input.provider,
    }

    const nameFromProvider = getFullName(
      selectedProvider.providerUserFirstName,
      selectedProvider.providerUserLastName,
    )

    if (input.name && input.name !== nameFromProvider) {
      data.name = input.name
    }

    if (input.name === nameFromProvider) {
      data.name = null
    }

    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data,
    })

    await detailedProfileCache.del(user.id)

    return {
      status: 'success',
      detailedProfile: await ProfileService.getDetailedProfile(user, {
        profile,
      }),
    }
  })
