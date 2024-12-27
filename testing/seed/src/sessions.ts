import '../shared/setup'
import { logger } from '@core/logger'
import { SessionSelect, UserTable } from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { gamesDb, sessionService } from '@games/services'
import { eq } from 'drizzle-orm'
import { output } from '../shared/output'

async function generateSessions() {
  const users = await gamesDb.query.UserTable.findMany({
    where: eq(UserTable.virtual, true),
  })

  const sessions: SessionSelect[] = []

  let created = 0

  for (const user of users) {
    try {
      const session = await sessionService.createSession({
        userId: user.id,
        provider: AccountProvider.VK,
        referrerId: null,
        referralCampaignId: null,
      })

      logger.info(`Created session ${++created}`)
      sessions.push(session)
    } catch (error) {
      logger.error(`Failed to create session for user ${user.id}: ${error}`)
    }
  }

  return sessions
}

async function run() {
  const sessions = await generateSessions()
  logger.info(`Generated ${sessions.length} sessions`)
  output('sessions', sessions)
  logger.info('Sessions saved to output/sessions.json')
}

run().then(() => process.exit(0))
