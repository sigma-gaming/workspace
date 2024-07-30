import { ProfileSelect } from '@dbs/games-schema'
import { UserRole } from '@dbs/games-types'
import { z } from 'zod'
import { AccountPublic } from './account'

export type ProfileDetailed = {
  name: string
  image: string | null
  roles: UserRole[]
  accounts: AccountPublic[]
} & ProfileSelect

export function getUserFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export function getUserInitials(name: string | null | undefined) {
  if (!name) return null

  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export const ProfileValidation = {
  UsernameSchema: z
    .string()
    .trim()
    .min(3, 'Минимальная длина - 3 символа')
    .max(20, 'Максимальная длина - 20 символов')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Допустимы только латинские буквы, цифры и нижнее подчеркивание',
    ),
  NameSchema: z
    .string()
    .trim()
    .min(1, 'Минимальная длина - 1 символ')
    .max(32, 'Максимальная длина - 32 символа')
    .regex(
      /^[!#$€£%&'"`()*+\-./:;,=<>?@\\^|А-Яа-яёЁA-Za-z0-9 ]+$/,
      'Содержатся недопустимые символы',
    ),
}
