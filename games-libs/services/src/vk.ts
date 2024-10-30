import { createLazyInstance, resolveOptions } from '@core/di'
import { VkOptionsToken } from '@games/options'
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

export class VkService {
  group: VK
  service: VK

  constructor() {
    const { groupToken, serviceToken } = resolveOptions(VkOptionsToken)

    this.group = new VK({
      token: groupToken,
    })

    this.service = new VK({
      token: serviceToken,
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

export const vkService = createLazyInstance(VkService)
