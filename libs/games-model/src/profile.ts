import {
  Account as PrismaAccount,
  Profile as PrismaProfile,
} from '@libs/games-db'
import { z } from 'zod'

export enum AccountProvider {
  VK = 'VK',
  Telegram = 'Telegram',
}

export interface AccountPublic {
  provider: AccountProvider
  providerUsername: string | null
  providerUserFirstName: string | null
  providerUserLastName: string | null
  providerUserImage: string | null
}

export interface Account extends AccountPublic {
  id: string
  createdAt: string
  updatedAt: string
  providerUserId: string
  userId: string
}

export interface Profile {
  id: string
  createdAt: string
  updatedAt: string
  name: string | null
  username: string | null
  usedProvider: AccountProvider
  userId: string
}

export interface ProfileDetailed extends Profile {
  image: string | null
  accounts: AccountPublic[]
}

export function normalizeAccount(account: PrismaAccount): Account {
  return {
    ...account,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    provider: account.provider as AccountProvider,
  }
}

export function normalizeProfile(profile: PrismaProfile): Profile {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    usedProvider: profile.usedProvider as AccountProvider,
  }
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
