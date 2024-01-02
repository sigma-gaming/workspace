import { BadRequestException } from '@libs/exceptions'
import { AccountProvider, getFullName } from '@libs/games-model'
import { z } from 'zod'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const updateProfile = procedure
  .input(
    z.object({
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

    let name = null

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

    await prisma.profile.update({
      where: { userId: user.id },
      data: { name, usedProvider: input.provider },
    })

    return { status: 'ok' }
  })
