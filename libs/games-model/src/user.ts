import { Account, Profile, User } from '@libs/games-db'

export type AccountPublic = Pick<
  Account,
  | 'provider'
  | 'providerUsername'
  | 'providerUserFirstName'
  | 'providerUserLastName'
  | 'providerUserImage'
>

export enum AccountProvider {
  VK = 'VK',
  Telegram = 'Telegram',
}

export type ProfileDetailed = Profile & {
  image: string | null
}

export type UserDetailed = User & {
  profile: ProfileDetailed | null
  accounts: AccountPublic[]
}

export function getFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}
