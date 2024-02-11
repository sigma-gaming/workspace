import { ChatMessageDetailed } from '@games/model'
import { gamesPubsubs } from '@games/redis'
import { observable } from '@trpc/server/observable'
import { procedure } from '../trpc'

export const subscription = procedure.subscription(() => {
  return observable<ChatMessageDetailed>((observer) => {
    const unsubscribe = gamesPubsubs.chatMessages.subscribe((message) => {
      observer.next(message)
    })

    return () => unsubscribe()
  })
})
