import '../shared/setup'
import { logger } from '@core/logger'
import { AccountProvider } from '@dbs/games-types'
import { fakerRU as faker } from '@faker-js/faker'
import { AuthOutcome, authService } from '@games/services'

const BATCH_SIZE = 50

async function generateUser() {
  const firstName = faker.person.firstName('male')
  const lastName = faker.person.lastName('male')
  const username = faker.internet.username({ firstName, lastName })

  const authentication = await authService.authenticate({
    virtual: true,
    provider: AccountProvider.VK,
    providerUserId: faker.string.uuid(),
    providerUserFirstName: firstName,
    providerUserLastName: lastName,
    providerUsername: username,
    providerUserImage: faker.image.avatar(),
  })

  if (
    authentication.outcome === AuthOutcome.SignedUp ||
    authentication.outcome === AuthOutcome.SignedIn
  ) {
    return authentication.user
  }

  return null
}

async function run(count: number) {
  for (let i = 0; i < count; i += BATCH_SIZE) {
    const users = await Promise.all(
      Array.from({ length: BATCH_SIZE }, generateUser),
    )

    logger.info(`Generated ${users.length} users`)
  }
}

run(1100).then(() => process.exit(0))
