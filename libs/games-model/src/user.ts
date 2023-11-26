import { Account, Profile, User } from '@sigma/games-db'

export type AccountPublic = Pick<
  Account,
  'provider' | 'providerUserName' | 'providerUserImage'
>

export type UserDetailed = User & {
  profile: Profile | null
  accounts: AccountPublic[]
}
