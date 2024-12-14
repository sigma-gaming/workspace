import { createLazyInstance, resolveOptions, Shutdownable } from '@core/di'
import { NotificationSelect } from '@dbs/games-schema'
import { ChatMessageDetailed } from '@games/model'
import { NatsService, PubSub, PubSubService } from '@games/nats'
import { GamesNatsOptionsToken } from '@games/options'

export class GamesPubSubRegistry extends Shutdownable {
  private nats: NatsService
  private service: PubSubService

  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageDetailed>
  maintenanceStarted: PubSub<void>

  constructor() {
    super()

    const options = resolveOptions(GamesNatsOptionsToken)

    const nats = new NatsService(options)
    this.nats = nats

    this.service = new PubSubService({ nats })

    this.notifications = this.service.create<NotificationSelect>({
      subject: 'notification',
    })

    this.chatMessages = this.service.create<ChatMessageDetailed>({
      subject: 'chat-message',
    })

    this.maintenanceStarted = this.service.create<void>({
      subject: 'maintenance-started',
    })
  }

  get ready() {
    return this.service.ready
  }

  async shutdown() {
    await this.nats.close()
  }
}

export const gamesPubsubs = createLazyInstance(GamesPubSubRegistry)
