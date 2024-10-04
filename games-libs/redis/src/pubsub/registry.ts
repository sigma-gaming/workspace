import { createSingletonProxy } from '@core/di'
import { NotificationSelect } from '@dbs/games-schema'
import { ChatMessageDetailed } from '@games/model'
import { singleton } from 'tsyringe-neo'
import { PubSub, PubSubService } from './service'

@singleton()
export class PubSubRegistry {
  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageDetailed>
  maintenanceStarted: PubSub<void>

  constructor(pubsubService: PubSubService) {
    this.notifications = pubsubService.create<NotificationSelect>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessageDetailed>({
      channelName: 'chat-messages',
    })

    this.maintenanceStarted = pubsubService.create<void>({
      channelName: 'maintenance-started',
    })
  }
}

export const gamesPubsubs = createSingletonProxy(PubSubRegistry)
