import { Logger, loggerService } from '@core/logger'
import { createDefer } from '@core/utils'
import { connect, ConnectionOptions, Events, NatsConnection } from 'nats'

export type NatsOptions = ConnectionOptions

export class NatsService {
  private connectionDefer = createDefer<NatsConnection>()
  private connection: NatsConnection | null = null
  private readonly logger: Logger
  private readonly options: NatsOptions
  private connectedOnce = false
  private connected = false

  constructor(options: NatsOptions) {
    this.options = options
    this.logger = loggerService.logger.child('NATS')
    this.setupConnection()
  }

  private async setupConnection() {
    try {
      this.connection = await connect(this.options)
      this.connectionDefer.resolve(this.connection)
      this.connected = true
      this.connectedOnce = true
      this.logger.info('Connection established')
      this.setupConnectionHandler()
    } catch (error) {
      this.logger.error('Failed to establish connection', { error })
      throw error
    }
  }

  private async setupConnectionHandler() {
    if (!this.connection) return

    this.connection.closed().then(() => {
      this.logger.warn('Connection permanently closed')
      this.logger.info('Recreating connection..')
      this.setupConnection()
    })

    for await (const status of this.connection.status()) {
      if (status.type === Events.Reconnect) {
        this.connected = true
        this.logger.info(`Reconnected: ${status.data}`)
      } else if (status.type === Events.Disconnect) {
        this.connected = false
        this.logger.info(`Disconnected: ${status.data}`)
      } else if (status.type === Events.Error) {
        this.logger.error(`Permissions error: ${status.data}`)
      } else if (status.type === Events.Update) {
        this.logger.info(`Connection update: ${status.data}`)
      } else {
        this.logger.info(`Connection status: ${status.type}`)
      }
    }
  }

  get ready(): boolean {
    if (!this.connectedOnce) return false
    return this.connected
  }

  getConnection(): NatsConnection {
    if (!this.connection) {
      throw new Error('NATS connection not established')
    }

    return this.connection
  }

  getConnectionPromise(): Promise<NatsConnection> {
    return this.connectionDefer.promise
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain()
      this.logger.info('Connection closed')
    }
  }
}
