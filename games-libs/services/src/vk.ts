import { createSingletonProxy } from '@core/di'
import { inject, InjectionToken, singleton } from 'tsyringe-neo'
import { APIError, VK } from 'vk-io'

type GroupMemberPayload = {
  groupId: number
  userId: number
  subscribed: boolean
}

export enum RepostStatus {
  Reposted = 'Reposted',
  NotFound = 'NotFound',
  WallNotAvailable = 'WallNotAvailable',
  ProfileDeleted = 'ProfileDeleted',
  TooManyRequests = 'TooManyRequests',
  Unknown = 'Unknown',
}

export type VkOptions = {
  groupToken: string
  serviceToken: string
}

export const VkOptionsToken: InjectionToken<VkOptions> =
  Symbol('VkOptionsToken')

@singleton()
export class VkService {
  group: VK
  service: VK

  constructor(@inject(VkOptionsToken) options: VkOptions) {
    this.group = new VK({
      token: options.groupToken,
    })

    this.service = new VK({
      token: options.serviceToken,
    })
  }

  async checkSubscription(userId: number, groupId: number) {
    const response = await this.group.api.groups.isMember({
      group_id: groupId,
      user_id: userId,
    })

    return response === 1
  }

  async getRepostStatus(
    userId: number,
    groupId: number,
    postId: number,
  ): Promise<RepostStatus> {
    try {
      const { items: posts } = await this.service.api.wall.get({
        owner_id: userId,
        count: 100,
      })

      for (const post of posts.slice(0, 2)) {
        const { copy_history } = post
        if (!copy_history) continue

        for (const { id, owner_id } of copy_history) {
          if (owner_id === -groupId && id === postId) {
            return RepostStatus.Reposted
          }
        }
      }

      return RepostStatus.NotFound
    } catch (error) {
      if (error instanceof APIError) {
        if (error.code === 15 || error.code === 30) {
          return RepostStatus.WallNotAvailable
        }

        if (error.code === 18) {
          return RepostStatus.ProfileDeleted
        }

        if (error.code === 6 || error.code === 29) {
          return RepostStatus.TooManyRequests
        }
      }

      return RepostStatus.Unknown
    }
  }

  onGroupJoin(handler: (payload: GroupMemberPayload) => void) {
    this.group.updates.on('group_join', (event) => {
      if (!event.$groupId) return

      handler({
        groupId: event.$groupId,
        userId: event.userId,
        subscribed: event.isJoin,
      })
    })
  }
}

export const vkService = createSingletonProxy(VkService)
