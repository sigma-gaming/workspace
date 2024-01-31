import { NotFoundException } from '@libs/exceptions'
import { Account, Profile } from '@libs/games-db'
import {
  getFullName,
  normalizeAccount,
  normalizeProfile,
  ProfileDetailed,
  User,
} from '@libs/games-model'
import { detailedProfileCache } from '../caches/profile'
import { prisma } from '../shared/db'

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
    (await prisma.profile.findUnique({
      where: { userId: user.id },
    }))

  const accounts =
    reused?.accounts ??
    (await prisma.account.findMany({
      where: { userId: user.id },
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
    ...normalizeProfile(profile),
    name: calculateName(),
    image: profileAccount?.providerUserImage ?? null,
    accounts: accounts.map(normalizeAccount),
  }

  await detailedProfileCache.set(user.id, detailedProfile)

  return detailedProfile
}

export const ProfileService = {
  getDetailedProfile,
}
