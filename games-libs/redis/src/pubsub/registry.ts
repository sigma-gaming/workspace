import { createSingletonProxy } from '@libs/di'
import { ChatMessage, Notification } from '@games/db-schema'
import { singleton } from 'tsyringe'
import { PubSub, PubSubService } from './service'

@singleton()
export class PubSubRegistry {
  notifications: PubSub<Notification>
  chatMessages: PubSub<ChatMessage>

  constructor(pubsubService: PubSubService) {
    this.notifications = pubsubService.create<Notification>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessage>({
      channelName: 'chat-messages',
    })
  }
}

export const gamesPubsubs = createSingletonProxy(PubSubRegistry)
