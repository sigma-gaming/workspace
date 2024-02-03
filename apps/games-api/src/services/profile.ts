import { NotFoundException } from '@libs/exceptions'
import {
  Account,
  Accounts,
  Profile,
  Profiles,
  User,
} from '@libs/games-db-schema'
import { getFullName, ProfileDetailed } from '@libs/games-model'
import { eq } from 'drizzle-orm'
import { detailedProfileCache } from '../caches/profile'
import { db } from '../shared/db'

interface Reused {
  profile?: Profile
  accounts?: Account[]
}

async function getDetailedProfile(
  user: User,
  reused?: Reused,
): Promise<ProfileDetailed> {
  const cached = await detailedProfileCache.get(user.id)

  if (cached) {
    return cached
  }

  const profile =
    reused?.profile ??
    (await db.query.Profiles.findFirst({
      where: eq(Profiles.userId, user.id),
    }))

  const accounts =
    reused?.accounts ??
    (await db.query.Accounts.findMany({
      where: eq(Accounts.userId, user.id),
    }))

  if (!profile) {
    throw new NotFoundException()
  }

  const profileAccount = accounts.find(
    (account) => account.provider === profile.usedProvider,
  )

  const calculateName = () => {
    if (profile.name) return profile.name
    if (!profileAccount) return null

    return getFullName(
      profileAccount.providerUserFirstName,
      profileAccount.providerUserLastName,
    )
  }

  const detailedProfile: ProfileDetailed = {
    ...profile,
    name: calculateName(),
    image: profileAccount?.providerUserImage ?? null,
    accounts,
  }

  await detailedProfileCache.set(user.id, detailedProfile)

  return detailedProfile
}

export const ProfileService = {
  getDetailedProfile,
}
