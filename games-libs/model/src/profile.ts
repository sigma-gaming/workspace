import { Profile } from '@games/db-schema'
import { z } from 'zod'
import { AccountPublic } from './account'

export interface ProfileDetailed extends Profile {
  image: string | null
  accounts: AccountPublic[]
}

export function getFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export const ProfileValidation = {
  UsernameSchema: z
    .string()
    .min(3, 'Минимальная длина - 3 символа')
    .max(20, 'Максимальная длина - 20 символов')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Допустимы только латинские буквы, цифры и нижнее подчеркивание',
    ),
  NameSchema: z
    .string()
    .min(1, 'Минимальная длина - 1 символ')
    .max(32, 'Максимальная длина - 32 символа')
    .regex(
      /^[!#$€£%&'"`()*+\-./:;,=<>?@\\^|А-Яа-яёЁA-Za-z0-9 ]+$/,
      'Содержатся недопустимые символы',
    ),
}
