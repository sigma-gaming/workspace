import { BadRequestException } from '@libs/exceptions'
import { AccountProvider, getFullName } from '@libs/games-model'
import { z } from 'zod'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const updateProfile = procedure
  .input(
    z.object({
      username: z.string(),
      name: z.string(),
      provider: z.nativeEnum(AccountProvider),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const user = SessionService.getUser(ctx.session)

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

    let username: string | null = null
    let name: string | null = null

    if (
      input.name &&
      input.name !==
        getFullName(
          selectedProvider.providerUserFirstName,
          selectedProvider.providerUserLastName,
        )
    ) {
      name = input.name
    }

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

      username = input.username
    }

    await prisma.profile.update({
      where: { userId: user.id },
      data: { name, username, usedProvider: input.provider },
    })

    return { status: 'success' }
  })
