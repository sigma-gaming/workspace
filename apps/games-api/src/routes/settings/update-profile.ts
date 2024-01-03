import { BadRequestException } from '@libs/exceptions'
import { Prisma } from '@libs/games-db'
import {
  AccountProvider,
  getFullName,
  ProfileValidation,
} from '@libs/games-model'
import { z } from 'zod'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const updateProfile = procedure
  .input(
    z.object({
      username: ProfileValidation.UsernameSchema.nullable(),
      name: ProfileValidation.NameSchema.optional(),
      provider: z.nativeEnum(AccountProvider),
    }),
  )
  .mutation(async ({ ctx, input }) => {
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
      username: input.username,
      usedProvider: input.provider,
    }

    const nameFromProvider = getFullName(
      selectedProvider.providerUserFirstName,
      selectedProvider.providerUserLastName,
    )

    if (input.name && input.name !== nameFromProvider) {
      data.name = input.name
    }

    await prisma.profile.update({
      where: { userId: user.id },
      data,
    })

    return { status: 'success' }
  })
