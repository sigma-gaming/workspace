import { Notification } from '@games/db-schema'
import { ChatMessageDetailed } from '@games/model'
import { createSingletonProxy } from '@libs/di'
import { singleton } from 'tsyringe'
import { PubSub, PubSubService } from './service'

@singleton()
export class PubSubRegistry {
  notifications: PubSub<Notification>
  chatMessages: PubSub<ChatMessageDetailed>

  constructor(pubsubService: PubSubService) {
    this.notifications = pubsubService.create<Notification>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessageDetailed>({
      channelName: 'chat-messages',
    })
  }
}

export const gamesPubsubs = createSingletonProxy(PubSubRegistry)
