import { autoInjectable } from 'tsyringe'
import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base'

@autoInjectable()
export class GlobalNumberEntityService extends GlobalEntityBaseService<number> {
  parse = Number
  stringify = String

  async incrBy(amount: number): Promise<number> {
    try {
      return await this.redis.incrby(this.key, amount)
    } catch (error) {
      this.logger.error('Failed to incrBy')
      throw error
    }
  }

  async decrBy(amount: number): Promise<number> {
    try {
      return await this.redis.decrby(this.key, amount)
    } catch (error) {
      this.logger.error('Failed to decrBy')
      throw error
    }
  }
}

@autoInjectable()
export class KeyNumberEntityService extends KeyEntityBaseService<number> {
  parse = Number
  stringify = String

  async incrBy(key: string, amount: number): Promise<number> {
    try {
      return await this.redis.incrby(this.keygen(key), amount)
    } catch (error) {
      this.logger(key).error('Failed to incrBy')
      throw error
    }
  }

  async decrBy(key: string, amount: number): Promise<number> {
    try {
      return await this.redis.decrby(this.keygen(key), amount)
    } catch (error) {
      this.logger(key).error('Failed to decrBy')
      throw error
    }
  }
}
