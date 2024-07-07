import { createSingletonProxy } from '@core/di'
import { ChatMessageSelect, NotificationSelect } from '@dbs/games-schema'
import { singleton } from 'tsyringe'
import { PubSub, PubSubService } from './service'

@singleton()
export class PubSubRegistry {
  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageSelect>
  maintenanceStarted: PubSub<void>

  constructor(pubsubService: PubSubService) {
    this.notifications = pubsubService.create<NotificationSelect>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessageSelect>({
      channelName: 'chat-messages',
    })

    this.maintenanceStarted = pubsubService.create<void>({
      channelName: 'maintenance-started',
    })
  }
}

export const gamesPubsubs = createSingletonProxy(PubSubRegistry)
