import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { AccountTable, ProfileTable, ProfileUpdate } from '@dbs/games-schema'
import { AccountProvider, UserRole } from '@dbs/games-types'
import { getUserFullName, ProfileValidation } from '@games/model'
import {
  gamesCache,
  gamesDb,
  profileService,
  roleService,
  sessionService,
  userService,
} from '@games/services'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createRouter } from '../../hono'

const reservedUsernames = [
  'sigma',
  'sigmadm',
  'sigmaadm',
  'sigmadmin',
  'sigmaadmin',
  'sigmagames',
  'sigmagaming',
  'sigma_admin',
  'sigma_support',
  'sigma_moderator',
  'sigma_developer',
  'sigma_dev',
  'sigma_owner',
  'sigma_bot',
  'sigma_service',
  'sigma_team',
  'sigma_staff',
  'sigma_helpdesk',
  'sigma_system',
  'sigmadev',
  'admin',
  'administrator',
  'moderator',
  'support',
  'helpdesk',
  'system',
  'root',
  'superuser',
  'manager',
  'operator',
  'team',
  'staff',
  'service',
  'developer',
  'dev',
  'owner',
  'bot',
  'api',
  'test',
  'master',
  'security',
  'info',
  'contact',
  'no-reply',
  'notifications',
  'noreply',
  'official',
  'webmaster',
  'help',
  'agent',
  'customer_service',
  'assistant',
  'user_support',
  'community',
  'guide',
  'consultant',
  'agent',
  'moderation',
  'moderators',
  'project',
  'control',
  'account',
  'client_service',
  'sysadmin',
  'team_leader',
  'group_admin',
  'contact_support',
  'customer_care',
  'management',
  'host',
  'monitor',
  'api_service',
  'backend',
  'frontend',
  'engineer',
  'developer_support',
  'server',
  'dashboard',
  'console',
  'admin_panel',
  'config',
  'analytics',
  'update',
  'access',
  'report',
  'auth',
  'authorization',
  'authentication',
]

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
    const { userId } = await sessionService.getHonoSession(ctx)
    const user = await userService.getUser(userId)
    const isAdmin = roleService.hasRole(user, UserRole.Admin)

    if (payload.username) {
      if (!isAdmin && reservedUsernames.includes(payload.username))
        throw new BadRequestException({
          path: ['username'],
          message: 'Недопустимый никнейм',
        })

      const currentProfile = await gamesDb.query.ProfileTable.findFirst({
        where: eq(ProfileTable.username, payload.username),
      })

      if (currentProfile && currentProfile.userId !== userId)
        throw new BadRequestException({
          path: ['username'],
          message: 'Пользователь с таким никнеймом уже существует',
        })
    }

    const accounts = await gamesDb.query.AccountTable.findMany({
      where: eq(AccountTable.userId, userId),
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
      .where(eq(ProfileTable.userId, userId))
      .returning()

    await gamesCache.detailedProfile.del(userId)

    return ctx.json({
      status: 'success',
      detailedProfile: await profileService.getDetailedProfile(userId, {
        profile,
      }),
    })
  },
)
