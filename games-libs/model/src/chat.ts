import { ChatMessage, User } from '@games/db-schema'
import { ProfileDetailed } from './profile'

export interface ChatMessageDetailed {
  chatMessage: ChatMessage
  user?: {
    id: User['id']
    roles: User['roles']
    profile: Pick<ProfileDetailed, 'id' | 'name' | 'username' | 'image'>
  }
}
