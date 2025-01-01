import { BadRequestException } from '@core/exceptions'
import { tbValidator, TypeboxError } from '@core/server'
import { AccountTable, ProfileTable, ProfileUpdate } from '@dbs/games-schema'
import { AccountProvider, UserRole } from '@dbs/games-types'
import { getUserFullName } from '@games/model'
import {
  gamesCache,
  gamesDb,
  profileService,
  roleService,
  sessionService,
  userService,
} from '@games/services'
import { Type } from '@sinclair/typebox'
import { eq } from 'drizzle-orm'
import { createRouter } from '../../app/router'
import { limitByIp } from '../../middlewares/rate-limit'

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

const PayloadSchema = Type.Object({
  username: Type.Optional(
    Type.String({
      minLength: 3,
      maxLength: 20,
      pattern: `^[a-zA-Z0-9_]+$`,
    }),
  ),
  name: Type.Optional(
    Type.String({
      minLength: 3,
      maxLength: 32,
      pattern: `^[!#$€£%&'"'()*+-./:;,=<>?@\\^|А-Яа-яёЁA-Za-z0-9 ]+$`,
    }),
  ),
  provider: Type.Enum(AccountProvider),
})

export const updateProfileRoute = createRouter().post(
  '/',
  limitByIp({ limit: 10, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema, {
    username: {
      [TypeboxError.StringMinLength]: 'Минимальная длина - 3 символа',
      [TypeboxError.StringMaxLength]: 'Максимальная длина - 20 символов',
      [TypeboxError.StringPattern]:
        'Допустимы только латинские буквы, цифры и нижнее подчеркивание',
    },
    name: {
      [TypeboxError.StringMinLength]: 'Минимальная длина - 3 символа',
      [TypeboxError.StringMaxLength]: 'Максимальная длина - 32 символов',
      [TypeboxError.StringPattern]: 'Содержатся недопустимые символы',
    },
    provider: {
      [TypeboxError.Union]: 'Неподдерживаемый провайдер',
    },
  }),
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

    await gamesDb
      .update(ProfileTable)
      .set(updates)
      .where(eq(ProfileTable.userId, userId))

    if (gamesCache.ready) {
      await gamesCache.detailedProfile.del(userId)
    }

    return ctx.json({
      status: 'success',
      detailedProfile: await profileService.getDetailedProfile(userId),
    })
  },
)
