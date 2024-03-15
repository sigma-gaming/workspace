import { ChatMessageSelect, NotificationSelect } from '@games/db-schema'
import { createSingletonProxy } from '@libs/di'
import { singleton } from 'tsyringe'
import { PubSub, PubSubService } from './service'

@singleton()
export class PubSubRegistry {
  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageSelect>

  constructor(pubsubService: PubSubService) {
    this.notifications = pubsubService.create<NotificationSelect>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessageSelect>({
      channelName: 'chat-messages',
    })
  }
}

export const gamesPubsubs = createSingletonProxy(PubSubRegistry)
