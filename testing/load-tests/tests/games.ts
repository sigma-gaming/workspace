import { readFileSync } from 'fs'
import { join } from 'path'
import { SessionSelect } from '@dbs/games-schema'

const sessions: SessionSelect[] = JSON.parse(
  readFileSync(join(process.cwd(), 'payload/sessions.json'), 'utf8'),
)

let nextSessionIndex = 0

function getNextSession() {
  const session = sessions[nextSessionIndex]

  if (!session) {
    throw new Error('Not enough sessions for all virtual users')
  }

  nextSessionIndex++
  return session
}

export function setSessionId(context: any, _: unknown, done: () => void) {
  const session = getNextSession()
  context.vars.sessionId = session.id
  done()
}
